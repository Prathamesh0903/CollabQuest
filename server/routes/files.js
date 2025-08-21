const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const Room = require('../models/Room');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const upload = multer({ dest: 'uploads/temp/' });

const router = express.Router();

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '../uploads');
const ensureUploadsDir = async () => {
  try {
    await fs.access(UPLOADS_DIR);
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  }
};

// Get all files for a session/room
router.get('/session/:sessionId', /* auth, */ async (req, res) => {
  try {
    const { sessionId } = req.params;
    const sessionDir = path.join(UPLOADS_DIR, sessionId);
    
    try {
      await fs.access(sessionDir);
    } catch {
      // Session directory doesn't exist yet, return empty
      return res.json({
        success: true,
        files: [],
        sessionId
      });
    }

    const files = await getFileTree(sessionDir, sessionId);
    
    res.json({
      success: true,
      files,
      sessionId
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get files',
      message: error.message
    });
  }
});

// Create a new file
router.post('/session/:sessionId', /* auth, */ async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { filename, content = '', language = 'javascript' } = req.body;
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        error: 'Filename is required'
      });
    }

    await ensureUploadsDir();
    const sessionDir = path.join(UPLOADS_DIR, sessionId);
    
    try {
      await fs.access(sessionDir);
    } catch {
      await fs.mkdir(sessionDir, { recursive: true });
    }

    // Generate default content based on language
    const defaultContent = getDefaultContent(language);
    const fileContent = content || defaultContent;
    
    const filePath = path.join(sessionDir, filename);
    await fs.writeFile(filePath, fileContent, 'utf8');

    const fileInfo = {
      id: uuidv4(),
      name: filename,
      path: filename,
      type: 'file',
      language,
      size: fileContent.length,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.status(201).json({
      success: true,
      file: fileInfo
    });
  } catch (error) {
    console.error('Create file error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create file',
      message: error.message
    });
  }
});

// Create a new folder
router.post('/session/:sessionId/folder', optionalAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { folderName } = req.body;
    
    if (!folderName) {
      return res.status(400).json({
        success: false,
        error: 'Folder name is required'
      });
    }

    await ensureUploadsDir();
    const sessionDir = path.join(UPLOADS_DIR, sessionId);
    const folderPath = path.join(sessionDir, folderName);
    
    try {
      await fs.access(folderPath);
      return res.status(400).json({
        success: false,
        error: 'Folder already exists'
      });
    } catch {
      // Folder doesn't exist, create it
    }

    await fs.mkdir(folderPath, { recursive: true });

    const folderInfo = {
      id: uuidv4(),
      name: folderName,
      path: folderName,
      type: 'folder',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.status(201).json({
      success: true,
      folder: folderInfo
    });
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create folder',
      message: error.message
    });
  }
});

// Read file content
router.get('/session/:sessionId/file/:filename(*)', optionalAuth, async (req, res) => {
  try {
    const { sessionId, filename } = req.params;
    const filePath = path.join(UPLOADS_DIR, sessionId, filename);
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const stats = await fs.stat(filePath);
      
      res.json({
        success: true,
        content,
        file: {
          name: path.basename(filename),
          path: filename,
          size: stats.size,
          updatedAt: stats.mtime
        }
      });
    } catch (fsError) {
      if (fsError.code === 'ENOENT') {
        return res.status(404).json({
          success: false,
          error: 'File not found'
        });
      }
      throw fsError;
    }
  } catch (error) {
    console.error('Read file error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read file',
      message: error.message
    });
  }
});

// Update file content
router.put('/session/:sessionId/file/:filename(*)', optionalAuth, async (req, res) => {
  try {
    const { sessionId, filename } = req.params;
    const { content } = req.body;
    
    if (content === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    const filePath = path.join(UPLOADS_DIR, sessionId, filename);
    await fs.writeFile(filePath, content, 'utf8');
    
    const stats = await fs.stat(filePath);
    
    res.json({
      success: true,
      file: {
        name: path.basename(filename),
        path: filename,
        size: stats.size,
        updatedAt: stats.mtime
      }
    });
  } catch (error) {
    console.error('Update file error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update file',
      message: error.message
    });
  }
});

// Delete file or folder
router.delete('/session/:sessionId/:itemType/:itemName(*)', optionalAuth, async (req, res) => {
  try {
    const { sessionId, itemType, itemName } = req.params;
    const itemPath = path.join(UPLOADS_DIR, sessionId, itemName);
    
    try {
      const stats = await fs.stat(itemPath);
      
      if (itemType === 'file') {
        await fs.unlink(itemPath);
      } else if (itemType === 'folder') {
        await fs.rmdir(itemPath, { recursive: true });
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid item type'
        });
      }
      
      res.json({
        success: true,
        message: `${itemType} deleted successfully`
      });
    } catch (fsError) {
      if (fsError.code === 'ENOENT') {
        return res.status(404).json({
          success: false,
          error: 'Item not found'
        });
      }
      throw fsError;
    }
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete item',
      message: error.message
    });
  }
});

// Rename file or folder
router.patch('/session/:sessionId/:itemType/:itemName(*)/rename', optionalAuth, async (req, res) => {
  try {
    const { sessionId, itemType, itemName } = req.params;
    const { newName } = req.body;
    
    if (!newName) {
      return res.status(400).json({
        success: false,
        error: 'New name is required'
      });
    }

    const oldPath = path.join(UPLOADS_DIR, sessionId, itemName);
    const newPath = path.join(UPLOADS_DIR, sessionId, newName);
    
    try {
      await fs.rename(oldPath, newPath);
      
      res.json({
        success: true,
        message: `${itemType} renamed successfully`,
        oldName: itemName,
        newName
      });
    } catch (fsError) {
      if (fsError.code === 'ENOENT') {
        return res.status(404).json({
          success: false,
          error: 'Item not found'
        });
      }
      throw fsError;
    }
  } catch (error) {
    console.error('Rename item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rename item',
      message: error.message
    });
  }
});

// Import local folder
router.post('/session/:sessionId/import-local', optionalAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { localPath } = req.body;
    
    if (!localPath) {
      return res.status(400).json({
        success: false,
        error: 'Local path is required'
      });
    }

    // Validate the local path exists and is a directory
    try {
      const stats = await fs.stat(localPath);
      if (!stats.isDirectory()) {
        return res.status(400).json({
          success: false,
          error: 'Path must be a directory'
        });
      }
    } catch (fsError) {
      if (fsError.code === 'ENOENT') {
        return res.status(400).json({
          success: false,
          error: 'Directory does not exist'
        });
      }
      return res.status(400).json({
        success: false,
        error: 'Invalid directory path'
      });
    }

    await ensureUploadsDir();
    const sessionDir = path.join(UPLOADS_DIR, sessionId);
    
    try {
      await fs.access(sessionDir);
    } catch {
      await fs.mkdir(sessionDir, { recursive: true });
    }

    // Copy the local folder contents to the session directory
    const folderName = path.basename(localPath);
    const targetPath = path.join(sessionDir, folderName);
    
    // Check if folder already exists in session
    try {
      await fs.access(targetPath);
      return res.status(400).json({
        success: false,
        error: 'Folder already exists in session'
      });
    } catch {
      // Folder doesn't exist, proceed with import
    }

    // Copy the entire folder
    await copyFolderRecursive(localPath, targetPath);

    // Get the updated file tree
    const files = await getFileTree(sessionDir, sessionId);
    
    res.json({
      success: true,
      message: 'Local folder imported successfully',
      files
    });
  } catch (error) {
    console.error('Import local folder error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import local folder',
      message: error.message
    });
  }
});

// Import files via file upload
router.post('/session/:sessionId/import-files', optionalAuth, upload.array('files'), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    await ensureUploadsDir();
    const sessionDir = path.join(UPLOADS_DIR, sessionId);
    
    try {
      await fs.access(sessionDir);
    } catch {
      await fs.mkdir(sessionDir, { recursive: true });
    }

    // Process uploaded files
    for (const file of files) {
      const relativePath = file.originalname;
      const targetPath = path.join(sessionDir, relativePath);
      
      // Ensure the directory structure exists
      const targetDir = path.dirname(targetPath);
      try {
        await fs.access(targetDir);
      } catch {
        await fs.mkdir(targetDir, { recursive: true });
      }
      
      // Move the uploaded file to the target location
      await fs.rename(file.path, targetPath);
    }

    // Get the updated file tree
    const fileTree = await getFileTree(sessionDir, sessionId);
    
    res.json({
      success: true,
      message: 'Files imported successfully',
      files: fileTree
    });
  } catch (error) {
    console.error('Import files error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import files',
      message: error.message
    });
  }
});

// Helper function to get file tree
async function getFileTree(dirPath, sessionId, relativePath = '') {
  const items = [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativeItemPath = path.join(relativePath, entry.name);
      
      if (entry.isDirectory()) {
        const children = await getFileTree(fullPath, sessionId, relativeItemPath);
        items.push({
          id: uuidv4(),
          name: entry.name,
          path: relativeItemPath,
          type: 'folder',
          children,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        const stats = await fs.stat(fullPath);
        const language = getLanguageFromExtension(entry.name);
        
        items.push({
          id: uuidv4(),
          name: entry.name,
          path: relativeItemPath,
          type: 'file',
          language,
          size: stats.size,
          createdAt: stats.birthtime,
          updatedAt: stats.mtime
        });
      }
    }
  } catch (error) {
    console.error('Error reading directory:', error);
  }
  
  return items;
}

// Helper function to get default content based on language
function getDefaultContent(language) {
  const defaults = {
    javascript: `// Welcome to collaborative JavaScript coding!
console.log("Hello, World!");

function greet(name) {
  return \`Hello, \${name}!\`;
}

// Start coding with your team!`,
    python: `# Welcome to collaborative Python coding!
print("Hello, World!")

def greet(name):
    return f"Hello, {name}!"

# Start coding with your team!`,
    java: `// Welcome to collaborative Java coding!
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
    
    public static String greet(String name) {
        return "Hello, " + name + "!";
    }
}`,
    cpp: `// Welcome to collaborative C++ coding!
#include <iostream>
#include <string>

using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
    csharp: `// Welcome to collaborative C# coding!
using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
    }
}`
  };
  
  return defaults[language] || defaults.javascript;
}

// Helper function to get language from file extension
function getLanguageFromExtension(filename) {
  const ext = path.extname(filename).toLowerCase().substring(1);
  const languageMap = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'go': 'go',
    'rs': 'rust',
    'php': 'php',
    'rb': 'ruby',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown',
    'txt': 'text'
  };
  return languageMap[ext] || 'text';
}

// Helper function to copy a folder recursively
async function copyFolderRecursive(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyFolderRecursive(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

module.exports = router;
