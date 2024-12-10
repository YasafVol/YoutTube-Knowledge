#!/usr/bin/env python3
"""
Clean Project Context Generator for Obsidian Plugins
Purpose: Generate concise, LLM-friendly project context files
"""

import json
import os
import datetime
from typing import Dict, Any

class ProjectContextGenerator:
    def __init__(self, project_root: str):
        self.project_root = project_root
        self.timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")

    def get_manifest_info(self) -> Dict[str, Any]:
        """Read basic plugin info from manifest.json"""
        manifest_path = os.path.join(self.project_root, 'manifest.json')
        try:
            if os.path.exists(manifest_path):
                with open(manifest_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return {
                        'name': data.get('name', ''),
                        'version': data.get('version', ''),
                        'description': data.get('description', '')
                    }
        except Exception as e:
            print(f"Warning: Could not read manifest.json: {e}")
        return {}

    def scan_project_files(self) -> Dict[str, Any]:
        """Get essential project structure"""
        structure = {}
        relevant_extensions = {'.ts', '.tsx', '.css', '.md', '.json'}
        
        for root, dirs, files in os.walk(self.project_root):
            # Skip non-project directories
            dirs[:] = [d for d in dirs if not d.startswith(('.', 'node_modules', 'dist'))]
            
            rel_path = os.path.relpath(root, self.project_root)
            if rel_path == '.':
                rel_path = ''
            
            relevant_files = [f for f in files 
                            if os.path.splitext(f)[1] in relevant_extensions]
            
            if relevant_files:
                structure[rel_path] = relevant_files
                
        return structure

    def analyze_main_file(self) -> Dict[str, Any]:
        """Extract core plugin features from main.ts"""
        main_path = os.path.join(self.project_root, 'main.ts')
        try:
            if os.path.exists(main_path):
                with open(main_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    return {
                        'has_settings': 'DEFAULT_SETTINGS' in content,
                        'has_commands': 'addCommand' in content,
                        'has_markdown_processor': 'registerMarkdownPostProcessor' in content,
                        'has_ribbon_icon': 'addRibbonIcon' in content
                    }
        except Exception as e:
            print(f"Warning: Could not analyze main.ts: {e}")
        return {}

    def generate_context(self) -> Dict[str, Any]:
        """Generate minimal, focused project context"""
        manifest = self.get_manifest_info()
        
        context = {
            "plugin": {
                "name": manifest.get('name', os.path.basename(self.project_root)),
                "version": manifest.get('version', '0.1.0'),
                "description": manifest.get('description', ''),
                "lastUpdated": datetime.datetime.now().isoformat()
            },
            "features": self.analyze_main_file(),
            "files": self.scan_project_files()
        }
        
        return context

    def save_context(self, context: Dict[str, Any]):
        """Save context to a JSON file"""
        try:
            # Ensure contexts directory exists
            contexts_dir = os.path.join(self.project_root, 'contexts')
            os.makedirs(contexts_dir, exist_ok=True)
            
            # Save current version with timestamp
            current_file = os.path.join(self.project_root, f'project_context_{self.timestamp}.json')
            with open(current_file, 'w', encoding='utf-8') as f:
                json.dump(context, f, indent=2, ensure_ascii=False)
            
            print(f"Context saved to {current_file}")
            
        except Exception as e:
            print(f"Error saving context: {e}")
            raise

def main():
    # Default to current directory if no path provided
    project_root = os.path.dirname(os.path.abspath(__file__))
    
    print(f"Analyzing project at: {project_root}")
    
    try:
        generator = ProjectContextGenerator(project_root)
        context = generator.generate_context()
        generator.save_context(context)
        print("Context generated successfully!")
        
    except Exception as e:
        print(f"Error: {e}")
        return 1
    
    return 0

if __name__ == '__main__':
    import sys
    sys.exit(main())
