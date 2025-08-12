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
    
    try {
      await fs.mkdir(executionDir, { recursive: true });
      
      const { filename, dockerImage, runCommand, compileCommand } = this.getLanguageConfig(language);
      const filePath = path.join(executionDir, filename);
      
      // Write source code to file
      await fs.writeFile(filePath, sourceCode, 'utf8');
      
      // Create Docker container and execute
      const result = await this.runInContainer(executionDir, dockerImage, runCommand, compileCommand, input);
      
      return result;
    } catch (error) {
      console.error('Docker execution error:', error);
      throw new Error(`Code execution failed: ${error.message}`);
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

  async runInContainer(executionDir, dockerImage, runCommand, compileCommand, input) {
    const startTime = Date.now();
    
    try {
      // Pull the Docker image if it doesn't exist
      await this.pullImage(dockerImage);
      
      // Create container
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
          NetworkMode: 'none', // No network access
          SecurityOpt: ['no-new-privileges'],
          ReadonlyRootfs: false
        }
      });

      try {
        // Start container
        await container.start();
        
        let stdout = '';
        let stderr = '';
        let compileOutput = '';
        
        // Compile if needed
        if (compileCommand) {
          try {
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
            }
          } catch (compileError) {
            stderr = `Compilation failed: ${compileError.message}`;
          }
        }
        
        // Run the code if compilation succeeded or not needed
        if (!compileCommand || !stderr) {
          try {
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
          } catch (runError) {
            stderr = `Execution failed: ${runError.message}`;
          }
        }
        
        const executionTime = Date.now() - startTime;
        
        return {
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          compile_output: compileOutput.trim(),
          status: stderr ? 'error' : 'success',
          executionTime
        };
        
      } finally {
        // Stop and remove container
        try {
          await container.stop({ t: 0 });
          await container.remove();
        } catch (cleanupError) {
          console.warn('Failed to cleanup container:', cleanupError);
        }
      }
      
    } catch (error) {
      throw new Error(`Container execution failed: ${error.message}`);
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
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      
      stream.on('data', (chunk) => {
        const data = chunk.toString();
        if (data.includes('stdout')) {
          stdout += data.split('stdout')[1] || '';
        } else if (data.includes('stderr')) {
          stderr += data.split('stderr')[1] || '';
        } else {
          stdout += data;
        }
      });
      
      stream.on('end', () => {
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
