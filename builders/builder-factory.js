const SimpleBuilder = require('./simple-builder');
const ComplexBuilder = require('./complex-builder');

/**
 * Factory for creating appropriate builders based on complexity
 */
class BuilderFactory {
  constructor() {
    this.simpleBuilder = new SimpleBuilder();
    this.complexBuilder = new ComplexBuilder();
  }

  /**
   * Get the appropriate builder based on panel complexity
   * @param {Object} metadata - Panel metadata containing complexity score
   * @returns {SimpleBuilder|ComplexBuilder}
   */
  getBuilder(metadata) {
    const complexity = metadata.complexity || 1;
    
    if (complexity <= process.env.COMPLEX_RENDERER_THRESHOLD) {
      console.log(`Using Simple Builder for complexity ${complexity}`);
      return this.simpleBuilder;
    } else {
      console.log(`Using Complex Builder for complexity ${complexity}`);
      return this.complexBuilder;
    }
  }

  /**
   * Build a panel using the appropriate builder
   * @param {Object} metadata - Panel metadata from thinker
   * @param {string} request - Original user request
   * @param {BrowserWindow} panelWindow - The panel window to stream to
   * @param {Function} savePanel - Function to save panel content
   * @param {Function} tryPrependWithSystemFile - Function to add system prompts
   * @returns {Promise<void>}
   */
  async build(metadata, request, panelWindow, savePanel, tryPrependWithSystemFile) {
    const builder = this.getBuilder(metadata);
    return await builder.build(metadata, request, panelWindow, savePanel, tryPrependWithSystemFile);
  }

  /**
   * Clean up all builders (called on app exit)
   * @returns {Promise<void>}
   */
  async cleanup() {
    // Only complex builder needs cleanup for Docker containers
    if (this.complexBuilder) {
      await this.complexBuilder.cleanup();
    }
  }
}

module.exports = BuilderFactory;
