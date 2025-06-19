import { FolderStructure } from "../types/plan";
import fs from "fs"
import { join, resolve } from "path"
 
export function getFolderStructure(folderPath: string): FolderStructure | null {
    const resolvedPath = resolve(folderPath);
  
    try {
    const stats = fs.statSync(resolvedPath);
    if (!stats.isDirectory()) {
      throw new Error('Path is not a directory');
    }

    const items = fs.readdirSync(resolvedPath);
    if (items.length === 0) {
      return {
        rootFolder: resolvedPath,
        subfolders: [],
        expectedFiles: []
      }
    }

    const subfolders: string[] = [];
    const expectedFiles: string[] = [];

    // Recursive function to traverse directory
    function traverseDirectory(currentPath: string, relativePath: string = '') {
      const items = fs.readdirSync(currentPath, { withFileTypes: true });

      for (const item of items) {
        const itemRelativePath = relativePath ? join(relativePath, item.name) : item.name;
        const itemFullPath = join(currentPath, item.name);

        if (item.isDirectory()) {
          subfolders.push(itemRelativePath);

          traverseDirectory(itemFullPath, itemRelativePath);
        } else if (item.isFile()) {
          expectedFiles.push(itemRelativePath);
        }
      }
    }

    traverseDirectory(resolvedPath);

    return {
      rootFolder: resolvedPath,
      subfolders,
      expectedFiles
    };

  } catch (error) {
    throw new Error(`Error analyzing folder structure: ${error.message}`);
  }
}
