const Docker = require('dockerode');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class DockerExecutor {
  constructor() {
    this.docker = new Docker();
    this.tempDir = path.join(__dirname, '../temp');
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await fs.access(this.tempDir);
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true });
    }
  }

  async executeCode(language, sourceCode, input = '') {
    const executionId = uuidv4();
    const executionDir = path.join(this.tempDir, executionId);
    const startTime = Date.now();
    let container = null;
    let runtimeLogs = [];
    let memoryUsage = 'N/A';
    let cpuUsage = 'N/A';
    
    try {
      await fs.mkdir(executionDir, { recursive: true });
      
      const { filename, dockerImage, runCommand, compileCommand } = this.getLanguageConfig(language);
      const filePath = path.join(executionDir, filename);
      
      // Write source code to file
      await fs.writeFile(filePath, sourceCode, 'utf8');
      
      // Add execution start log
      runtimeLogs.push({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: `Starting ${language} code execution in Docker container`,
        details: {
          execution_id: executionId,
          docker_image: dockerImage,
          filename: filename,
          code_length: sourceCode.length
        }
      });
      
      // Create Docker container and execute
      const result = await this.runInContainerWithMonitoring(
        executionDir, 
        dockerImage, 
        runCommand, 
        compileCommand, 
        input,
        runtimeLogs
      );
      
      // Add successful execution log
      runtimeLogs.push({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: 'Docker container execution completed successfully',
        details: {
          execution_time: Date.now() - startTime,
          container_id: result.container_id,
          stdout_length: result.stdout?.length || 0,
          stderr_length: result.stderr?.length || 0
        }
      });
      
      return {
        ...result,
        runtime_logs: runtimeLogs,
        memory_used: memoryUsage,
        cpu_usage: cpuUsage,
        container_id: result.container_id
      };
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Add error log
      runtimeLogs.push({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: 'Docker container execution failed',
        details: {
          execution_time: executionTime,
          error_message: error.message,
          container_id: container?.id || null
        }
      });
      
      console.error('Docker execution error:', error);
      
      // Create enhanced error with runtime logs
      const enhancedError = new Error(`Code execution failed: ${error.message}`);
      enhancedError.runtime_logs = runtimeLogs;
      enhancedError.memory_used = memoryUsage;
      enhancedError.cpu_usage = cpuUsage;
      enhancedError.container_id = container?.id || null;
      enhancedError.execution_time = executionTime;
      
      throw enhancedError;
    } finally {
      // Clean up temporary files
      try {
        await fs.rm(executionDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn('Failed to cleanup execution directory:', cleanupError);
      }
    }
  }

  async executeCodeWithConfig(dockerConfig, sourceCode, input = '', timeout = 30000) {
    const executionId = uuidv4();
    const executionDir = path.join(this.tempDir, executionId);
    const startTime = Date.now();
    let runtimeLogs = [];
    try {
      await fs.mkdir(executionDir, { recursive: true });
      const filename = dockerConfig.filename || 'Main.java';
      const filePath = path.join(executionDir, filename);
      await fs.writeFile(filePath, sourceCode, 'utf8');

      runtimeLogs.push({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: 'Starting execution with explicit docker config',
        details: { image: dockerConfig.image, filename }
      });

      const result = await this.runInContainerWithMonitoring(
        executionDir,
        dockerConfig.image,
        dockerConfig.runCommand,
        dockerConfig.compileCommand,
        input,
        runtimeLogs
      );

      return { ...result, runtime_logs: runtimeLogs };
    } catch (error) {
      const enhanced = new Error(error.message);
      enhanced.runtime_logs = runtimeLogs;
      throw enhanced;
    } finally {
      try { await fs.rm(executionDir, { recursive: true, force: true }); } catch {}
    }
  }

  async executeCodeWithFiles(language, sourceCode, input, uploadedFiles, sessionId, timeout = 10000, memoryLimit = '256MB') {
    const executionId = uuidv4();
    const executionDir = path.join(this.tempDir, executionId);
    const startTime = Date.now();
    let container = null;
    let runtimeLogs = [];
    let memoryUsage = 'N/A';
    let cpuUsage = 'N/A';
    let generatedFiles = [];
    
    try {
      await fs.mkdir(executionDir, { recursive: true });
      
      const { filename, dockerImage, runCommand, compileCommand } = this.getLanguageConfig(language);
      const mainFilePath = path.join(executionDir, filename);
      
      // Write main source code to file
      await fs.writeFile(mainFilePath, sourceCode, 'utf8');
      
      // Copy uploaded files to execution directory
      if (uploadedFiles && uploadedFiles.length > 0) {
        runtimeLogs.push({
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message: 'Copying uploaded files to execution directory',
          details: {
            files_count: uploadedFiles.length,
            files: uploadedFiles.map(f => f.originalname)
          }
        });
        
        for (const file of uploadedFiles) {
          const targetPath = path.join(executionDir, file.originalname);
          await fs.copyFile(file.path, targetPath);
        }
      }
      
      // Add execution start log
      runtimeLogs.push({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: `Starting ${language} code execution with files in Docker container`,
        details: {
          execution_id: executionId,
          docker_image: dockerImage,
          main_file: filename,
          code_length: sourceCode.length,
          files_uploaded: uploadedFiles?.length || 0
        }
      });
      
      // Create Docker container and execute
      const result = await this.runInContainerWithMonitoring(
        executionDir, 
        dockerImage, 
        runCommand, 
        compileCommand, 
        input,
        runtimeLogs
      );
      
      // Collect generated files after execution
      try {
        const entries = await fs.readdir(executionDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isFile() && entry.name !== filename) {
            const filePath = path.join(executionDir, entry.name);
            const stats = await fs.stat(filePath);
            
            // Copy generated file to session directory
            const sessionDir = path.join(__dirname, '../uploads', sessionId);
            await fs.mkdir(sessionDir, { recursive: true });
            const sessionFilePath = path.join(sessionDir, entry.name);
            await fs.copyFile(filePath, sessionFilePath);
            
            generatedFiles.push({
              name: entry.name,
              size: stats.size,
              path: entry.name
            });
          }
        }
      } catch (fileError) {
        console.warn('Failed to collect generated files:', fileError);
      }
      
      // Add successful execution log
      runtimeLogs.push({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: 'Docker container execution with files completed successfully',
        details: {
          execution_time: Date.now() - startTime,
          container_id: result.container_id,
          stdout_length: result.stdout?.length || 0,
          stderr_length: result.stderr?.length || 0,
          files_generated: generatedFiles.length
        }
      });
      
      return {
        ...result,
        runtime_logs: runtimeLogs,
        memory_used: memoryUsage,
        cpu_usage: cpuUsage,
        container_id: result.container_id,
        generated_files: generatedFiles
      };
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Add error log
      runtimeLogs.push({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: 'Docker container execution with files failed',
        details: {
          execution_time: executionTime,
          error_message: error.message,
          container_id: container?.id || null
        }
      });
      
      console.error('Docker execution with files error:', error);
      
      // Create enhanced error with runtime logs
      const enhancedError = new Error(`Code execution with files failed: ${error.message}`);
      enhancedError.runtime_logs = runtimeLogs;
      enhancedError.memory_used = memoryUsage;
      enhancedError.cpu_usage = cpuUsage;
      enhancedError.container_id = container?.id || null;
      enhancedError.execution_time = executionTime;
      
      throw enhancedError;
    } finally {
      // Clean up temporary files
      try {
        await fs.rm(executionDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn('Failed to cleanup execution directory:', cleanupError);
      }
    }
  }

  getLanguageConfig(language) {
    const configs = {
      javascript: {
        filename: 'main.js',
        dockerImage: 'node:18-alpine',
        runCommand: ['node', 'main.js'],
        compileCommand: null
      },
      python: {
        filename: 'main.py',
        dockerImage: 'python:3.11-alpine',
        runCommand: ['python', 'main.py'],
        compileCommand: null
      },
      java: {
        filename: 'Main.java',
        dockerImage: 'openjdk:17-alpine',
        runCommand: ['java', 'Main'],
        compileCommand: ['javac', 'Main.java']
      },
      cpp: {
        filename: 'main.cpp',
        dockerImage: 'gcc:latest',
        runCommand: ['./main'],
        compileCommand: ['g++', '-o', 'main', 'main.cpp']
      },
      csharp: {
        filename: 'Program.cs',
        dockerImage: 'mcr.microsoft.com/dotnet/sdk:7.0',
        runCommand: ['dotnet', 'run'],
        compileCommand: ['dotnet', 'new', 'console', '--force']
      },
      go: {
        filename: 'main.go',
        dockerImage: 'golang:1.21-alpine',
        runCommand: ['go', 'run', 'main.go'],
        compileCommand: null
      },
      rust: {
        filename: 'main.rs',
        dockerImage: 'rust:1.75-alpine',
        runCommand: ['./main'],
        compileCommand: ['rustc', 'main.rs', '-o', 'main']
      },
      php: {
        filename: 'main.php',
        dockerImage: 'php:8.2-alpine',
        runCommand: ['php', 'main.php'],
        compileCommand: null
      },
      ruby: {
        filename: 'main.rb',
        dockerImage: 'ruby:3.2-alpine',
        runCommand: ['ruby', 'main.rb'],
        compileCommand: null
      }
    };

    const config = configs[language];
    if (!config) {
      throw new Error(`Unsupported language: ${language}`);
    }

    return config;
  }

  async runInContainerWithMonitoring(executionDir, dockerImage, runCommand, compileCommand, input, runtimeLogs) {
    const startTime = Date.now();
    
    try {
      // Pull the Docker image if it doesn't exist
      await this.pullImage(dockerImage);
      
      // Create container with enhanced security and monitoring
      const container = await this.docker.createContainer({
        Image: dockerImage,
        Cmd: ['/bin/sh', '-c', 'sleep 30'], // Keep container alive
        WorkingDir: '/workspace',
        HostConfig: {
          Binds: [`${executionDir}:/workspace`],
          Memory: 512 * 1024 * 1024, // 512MB memory limit
          MemorySwap: 0,
          CpuPeriod: 100000,
          CpuQuota: 50000, // 50% CPU limit
          PidsLimit: 50, // Process limit
          NetworkMode: 'none', // No network access
          SecurityOpt: ['no-new-privileges'],
          ReadonlyRootfs: false,
          Ulimits: [
            { Name: 'nofile', Soft: 64, Hard: 64 },
            { Name: 'nproc', Soft: 50, Hard: 50 },
            { Name: 'fsize', Soft: 1024 * 1024, Hard: 1024 * 1024 },
            { Name: 'core', Soft: 0, Hard: 0 }
          ],
          AutoRemove: true,
          RestartPolicy: { Name: 'no' }
        },
        Labels: {
          'execution.type': 'code-execution',
          'language': 'unknown',
          'created.by': 'docker-executor'
        }
      });

      try {
        // Start container
        await container.start();
        
        // Add container start log
        runtimeLogs.push({
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message: 'Docker container started',
          details: {
            container_id: container.id,
            image: dockerImage
          }
        });
        
        let stdout = '';
        let stderr = '';
        let compileOutput = '';
        let exitCode = 0;
        
        // Monitor container resources
        const resourceMonitor = this.monitorContainerResources(container, runtimeLogs);
        
        // Compile if needed
        if (compileCommand) {
          try {
            runtimeLogs.push({
              timestamp: new Date().toISOString(),
              level: 'INFO',
              message: 'Starting compilation',
              details: {
                compile_command: compileCommand.join(' ')
              }
            });
            
            const compileResult = await container.exec({
              Cmd: compileCommand,
              AttachStdout: true,
              AttachStderr: true
            });
            
            const compileStream = await compileResult.start();
            const compileData = await this.getExecOutput(compileStream);
            
            if (compileData.stderr) {
              compileOutput = compileData.stderr;
              stderr = compileData.stderr;
              exitCode = 1;
              
              runtimeLogs.push({
                timestamp: new Date().toISOString(),
                level: 'ERROR',
                message: 'Compilation failed',
                details: {
                  stderr: compileData.stderr.substring(0, 500)
                }
              });
            } else {
              runtimeLogs.push({
                timestamp: new Date().toISOString(),
                level: 'INFO',
                message: 'Compilation completed successfully'
              });
            }
          } catch (compileError) {
            stderr = `Compilation failed: ${compileError.message}`;
            exitCode = 1;
            
            runtimeLogs.push({
              timestamp: new Date().toISOString(),
              level: 'ERROR',
              message: 'Compilation error',
              details: {
                error_message: compileError.message
              }
            });
          }
        }
        
        // Run the code if compilation succeeded or not needed
        if (!compileCommand || !stderr) {
          try {
            runtimeLogs.push({
              timestamp: new Date().toISOString(),
              level: 'INFO',
              message: 'Starting code execution',
              details: {
                run_command: runCommand.join(' ')
              }
            });
            
            const runResult = await container.exec({
              Cmd: runCommand,
              AttachStdout: true,
              AttachStderr: true,
              AttachStdin: true
            });
            
            const runStream = await runResult.start();
            
            // Send input if provided
            if (input) {
              runStream.write(input);
              runStream.end();
            }
            
            const runData = await this.getExecOutput(runStream);
            stdout = runData.stdout;
            if (runData.stderr) {
              stderr = runData.stderr;
            }
            
            runtimeLogs.push({
              timestamp: new Date().toISOString(),
              level: 'INFO',
              message: 'Code execution completed',
              details: {
                stdout_length: stdout.length,
                stderr_length: stderr.length
              }
            });
          } catch (runError) {
            stderr = `Execution failed: ${runError.message}`;
            exitCode = 1;
            
            runtimeLogs.push({
              timestamp: new Date().toISOString(),
              level: 'ERROR',
              message: 'Execution error',
              details: {
                error_message: runError.message
              }
            });
          }
        }
        
        // Stop resource monitoring
        clearInterval(resourceMonitor);
        
        const executionTime = Date.now() - startTime;
        
        // Get final resource usage
        const finalStats = await this.getContainerStats(container);
        
        return {
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          compile_output: compileOutput.trim(),
          status: exitCode === 0 ? 'success' : 'error',
          executionTime,
          container_id: container.id,
          exit_code: exitCode,
          memory_used: finalStats.memory_used,
          cpu_usage: finalStats.cpu_usage
        };
        
      } finally {
        // Stop and remove container
        try {
          await container.stop({ t: 0 });
          await container.remove();
          
          runtimeLogs.push({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: 'Docker container stopped and removed',
            details: {
              container_id: container.id
            }
          });
        } catch (cleanupError) {
          console.warn('Failed to cleanup container:', cleanupError);
          
          runtimeLogs.push({
            timestamp: new Date().toISOString(),
            level: 'WARN',
            message: 'Container cleanup failed',
            details: {
              error_message: cleanupError.message
            }
          });
        }
      }
      
    } catch (error) {
      throw new Error(`Container execution failed: ${error.message}`);
    }
  }

  async monitorContainerResources(container, runtimeLogs) {
    const monitor = setInterval(async () => {
      try {
        const stats = await this.getContainerStats(container);
        
        // Log resource usage every 2 seconds
        runtimeLogs.push({
          timestamp: new Date().toISOString(),
          level: 'DEBUG',
          message: 'Resource usage update',
          details: {
            memory_used: stats.memory_used,
            cpu_usage: stats.cpu_usage,
            memory_percent: stats.memory_percent
          }
        });
        
        // Check for resource limits
        if (stats.memory_percent > 90) {
          runtimeLogs.push({
            timestamp: new Date().toISOString(),
            level: 'WARN',
            message: 'Memory usage approaching limit',
            details: {
              memory_percent: stats.memory_percent
            }
          });
        }
        
        if (stats.cpu_usage > 80) {
          runtimeLogs.push({
            timestamp: new Date().toISOString(),
            level: 'WARN',
            message: 'CPU usage is high',
            details: {
              cpu_usage: stats.cpu_usage
            }
          });
        }
        
      } catch (error) {
        console.error('Resource monitoring error:', error);
      }
    }, 2000);
    
    return monitor;
  }

  async getContainerStats(container) {
    try {
      const stats = await container.stats({ stream: false });
      
      const memoryUsage = stats.memory_stats.usage || 0;
      const memoryLimit = stats.memory_stats.limit || 1;
      const memoryPercent = (memoryUsage / memoryLimit) * 100;
      
      const cpuUsage = this.calculateCPUUsage(stats);
      
      return {
        memory_used: `${(memoryUsage / 1024 / 1024).toFixed(2)}MB`,
        memory_percent: memoryPercent.toFixed(2),
        cpu_usage: `${cpuUsage.toFixed(2)}%`
      };
    } catch (error) {
      return {
        memory_used: 'N/A',
        memory_percent: 0,
        cpu_usage: 'N/A'
      };
    }
  }

  calculateCPUUsage(stats) {
    try {
      const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
      const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
      
      if (systemDelta > 0 && cpuDelta > 0) {
        return (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  async pullImage(imageName) {
    try {
      const image = this.docker.getImage(imageName);
      await image.inspect();
    } catch {
      console.log(`Pulling Docker image: ${imageName}`);
      return new Promise((resolve, reject) => {
        this.docker.pull(imageName, (err, stream) => {
          if (err) {
            reject(err);
            return;
          }
          
          stream.on('end', () => resolve());
          stream.on('error', reject);
        });
      });
    }
  }

  async getExecOutput(stream) {
    // Docker exec output is multiplexed when TTY is disabled; demux it properly
    const { PassThrough } = require('stream');
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      const stdoutStream = new PassThrough();
      const stderrStream = new PassThrough();

      stdoutStream.on('data', (chunk) => {
        stdout += chunk.toString();
      });
      stderrStream.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      // Use docker modem to demultiplex the hijacked stream
      try {
        this.docker.modem.demuxStream(stream, stdoutStream, stderrStream);
      } catch (_) {
        // Fallback: treat all data as stdout if demux not available
        stream.on('data', (chunk) => { stdout += chunk.toString(); });
      }

      stream.on('end', () => {
        // Ensure streams are flushed
        stdoutStream.end();
        stderrStream.end();
        resolve({ stdout, stderr });
      });
    });
  }

  async checkHealth() {
    try {
      await this.docker.ping();
      return { status: 'healthy', message: 'Docker daemon is running' };
    } catch (error) {
      return { status: 'unhealthy', message: error.message };
    }
  }
}

module.exports = DockerExecutor;
