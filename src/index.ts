#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { AppleDevDocsClient } from './apple-client.js';

class AppleDevDocsMcpServer {
  private server: Server;
  private client: AppleDevDocsClient;

  constructor() {
    this.server = new Server(
      {
        name: 'apple-dev-docs-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.client = new AppleDevDocsClient();
    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'list_technologies',
            description: 'List all available Apple technologies/frameworks',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
          {
            name: 'browse_framework',
            description: 'Browse the structure and topics of a specific framework',
            inputSchema: {
              type: 'object',
              properties: {
                framework: {
                  type: 'string',
                  description: 'Framework name (e.g., "SwiftUI", "UIKit", "Foundation")',
                },
              },
              required: ['framework'],
            },
          },
          {
            name: 'get_symbol',
            description: 'Get detailed documentation for a specific symbol/class/struct',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Documentation path (e.g., "documentation/SwiftUI/View")',
                },
              },
              required: ['path'],
            },
          },
          {
            name: 'search_symbols',
            description: 'Search for symbols across Apple frameworks (supports wildcards like "RPBroadcast*")',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query (supports wildcards: * and ?)',
                },
                framework: {
                  type: 'string',
                  description: 'Optional: Search within specific framework only',
                },
                symbolType: {
                  type: 'string',
                  description: 'Optional: Filter by symbol type (class, protocol, struct, etc.)',
                },
                platform: {
                  type: 'string',
                  description: 'Optional: Filter by platform (iOS, macOS, etc.)',
                },
                maxResults: {
                  type: 'number',
                  description: 'Optional: Maximum number of results (default: 20)',
                },
              },
              required: ['query'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'list_technologies':
            return await this.handleListTechnologies();
          
          case 'browse_framework':
            return await this.handleBrowseFramework(request.params.arguments);
          
          case 'get_symbol':
            return await this.handleGetSymbol(request.params.arguments);
          
          case 'search_symbols':
            return await this.handleSearchSymbols(request.params.arguments);
          
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing tool: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  private async handleListTechnologies() {
    const technologies = await this.client.getTechnologies();
    
    // Group technologies by type/category
    const frameworks: Array<{name: string, description: string}> = [];
    const others: Array<{name: string, description: string}> = [];
    
    Object.values(technologies).forEach((tech) => {
      if (tech.kind === 'symbol' && tech.role === 'collection') {
        const description = this.client.extractText(tech.abstract);
        const item = { name: tech.title, description };
        
        // Popular frameworks first
        if (['SwiftUI', 'UIKit', 'AppKit', 'Foundation', 'Core Data', 'Combine'].includes(tech.title)) {
          frameworks.unshift(item);
        } else {
          frameworks.push(item);
        }
      } else {
        const description = this.client.extractText(tech.abstract);
        others.push({ name: tech.title, description });
      }
    });

    const content = [
      '# Apple Developer Technologies\n',
      '## Core Frameworks\n',
      ...frameworks.slice(0, 15).map(f => `• **${f.name}** - ${f.description}`),
      '\n## Additional Technologies\n',
      ...others.slice(0, 10).map(f => `• **${f.name}** - ${f.description}`),
      '\n*Use `browse_framework <name>` to explore a specific framework*',
      `\n\n**Total: ${frameworks.length + others.length} technologies available**`
    ].join('\n');

    return {
      content: [
        {
          type: 'text',
          text: content,
        },
      ],
    };
  }

  private async handleBrowseFramework(args: any) {
    const { framework } = args;
    const data = await this.client.getFramework(framework);
    
    const title = data.metadata?.title || framework;
    const description = this.client.extractText(data.abstract);
    const platforms = this.client.formatPlatforms(data.metadata?.platforms);
    
    const content = [
      `# ${title} Framework\n`,
      `**Platforms:** ${platforms}\n`,
      `## Overview`,
      description,
      '\n## Topics\n',
      ...data.topicSections.map(section => {
        const count = section.identifiers?.length || 0;
        return `• **${section.title}** (${count} items)`;
      }),
      '\n*Use `get_symbol <path>` for specific documentation*',
      '*Example: `get_symbol documentation/SwiftUI/View`*'
    ].join('\n');

    return {
      content: [
        {
          type: 'text',
          text: content,
        },
      ],
    };
  }

  private async handleGetSymbol(args: any) {
    const { path } = args;
    const data = await this.client.getSymbol(path);
    
    const title = data.metadata?.title || 'Symbol';
    const kind = data.metadata?.symbolKind || 'Unknown';
    const platforms = this.client.formatPlatforms(data.metadata?.platforms);
    const description = this.client.extractText(data.abstract);
    
    let content = [
      `# ${title}\n`,
      `**Type:** ${kind}`,
      `**Platforms:** ${platforms}\n`,
      '## Overview',
      description
    ];

    // Add topic sections if available
    if (data.topicSections && data.topicSections.length > 0) {
      content.push('\n## API Reference\n');
      data.topicSections.forEach(section => {
        content.push(`### ${section.title}`);
        if (section.identifiers && section.identifiers.length > 0) {
          section.identifiers.slice(0, 5).forEach(id => {
            const ref = data.references?.[id];
            if (ref) {
              const refDesc = this.client.extractText(ref.abstract || []);
              content.push(`• **${ref.title}** - ${refDesc.substring(0, 100)}${refDesc.length > 100 ? '...' : ''}`);
            }
          });
          if (section.identifiers.length > 5) {
            content.push(`*... and ${section.identifiers.length - 5} more items*`);
          }
        }
        content.push('');
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: content.join('\n'),
        },
      ],
    };
  }

  private async handleSearchSymbols(args: any) {
    const { query, framework, symbolType, platform, maxResults = 20 } = args;
    
    let results;
    if (framework) {
      // Search within specific framework
      results = await this.client.searchFramework(framework, query, {
        symbolType,
        platform,
        maxResults
      });
    } else {
      // Global search across frameworks
      results = await this.client.searchGlobal(query, {
        symbolType,
        platform,
        maxResults
      });
    }

    const content = [
      `# Search Results for "${query}"\n`,
      framework ? `**Framework:** ${framework}` : '**Scope:** All frameworks',
      symbolType ? `**Symbol Type:** ${symbolType}` : '',
      platform ? `**Platform:** ${platform}` : '',
      `**Found:** ${results.length} results\n`
    ].filter(Boolean);

    if (results.length > 0) {
      content.push('## Results\n');
      results.forEach((result, index) => {
        content.push(`### ${index + 1}. ${result.title}`);
        content.push(`**Framework:** ${result.framework}${result.symbolKind ? ` | **Type:** ${result.symbolKind}` : ''}`);
        if (result.platforms) {
          content.push(`**Platforms:** ${result.platforms}`);
        }
        content.push(`**Path:** \`${result.path}\``);
        if (result.description) {
          content.push(`${result.description.substring(0, 150)}${result.description.length > 150 ? '...' : ''}`);
        }
        content.push('');
      });
      
      content.push(`*Use \`get_symbol\` with any path above to see detailed documentation*`);
    } else {
      content.push('## No Results Found\n');
      content.push('Try:');
      content.push('• Broader search terms');
      content.push('• Wildcard patterns (e.g., "UI*", "*View*")'); 
      content.push('• Removing filters');
    }

    return {
      content: [
        {
          type: 'text',
          text: content.join('\n'),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Apple Developer Documentation MCP server running on stdio');
  }
}

const server = new AppleDevDocsMcpServer();
server.run().catch(console.error); 