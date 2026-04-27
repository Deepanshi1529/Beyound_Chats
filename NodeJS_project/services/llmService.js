const Groq = require("groq-sdk");
const config = require("../config/config");
const Logger = require("../utils/logger");

class LLMService {
  constructor() {
    this.client = new Groq({
      apiKey: config.llm.groqApiKey
    });
    this.modelName = config.llm.model;
  }

  async optimizeArticle(originalArticle, competitorArticles) {
    try {
      Logger.info(`Using Groq model: ${this.modelName}`);

      const prompt = this.buildPrompt(originalArticle, competitorArticles);

      const completion = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [
          { role: "system", content: "You are an expert SEO content writer." },
          { role: "user", content: prompt }
        ],
        max_tokens: config.llm.maxTokens,
        temperature: 0.7
      });

      return completion.choices[0].message.content;
    } catch (error) {
      Logger.error("Error calling Groq API", error.message);
      throw error;
    }
  }

  // Build comprehensive prompt with competitor analysis
  buildPrompt(originalArticle, competitorArticles) {
    const competitorSummaries = competitorArticles.map((art, idx) => 
      `Article ${idx + 1}:\nTitle: ${art.title}\nContent: ${art.content.substring(0, 2000)}`
    ).join('\n\n---\n\n');

    return `You are an expert SEO content writer. Your task is to rewrite the given article to match the quality, formatting, and depth of top-ranking competitor articles.

=== ORIGINAL ARTICLE ===
Title: ${originalArticle.title}
Excerpt: ${originalArticle.excerpt}
Existing Content: ${originalArticle.content || 'No content available'}

=== COMPETITOR ARTICLES (Top Google Results) ===
${competitorSummaries}

=== INSTRUCTIONS ===

1. **Structure & Formatting**: Analyze how the competitor articles structure their content (headings, subheadings, paragraphs, bullet points, examples). Match that formatting style.

2. **Content Depth**: Expand on the original article with detailed explanations, real-world examples, and actionable insights similar to the competitors.

3. **SEO Optimization**: 
   - Include relevant keywords naturally throughout
   - Use clear, descriptive headings (H2, H3)
   - Add meta description territory
   - Include FAQ section if competitors use them

4. **Engagement Elements**: 
   - Start with a compelling introduction
   - Use bullet points for lists
   - Add call-to-action elements
   - Include practical tips/step-by-step guides if competitors do

5. **Length**: Target 1500-2500 words (match competitor depth)

6. **Tone**: Match the tone of competing articles (professional, conversational, technical, etc.)

7. **Unique Value**: While matching format, ensure your version is more comprehensive and valuable than competitors

Write the complete rewritten article in Markdown format. The article should be ready to publish and should significantly improve upon the original while matching the quality of top-ranking pages.`;
  }

  // ✅ ADD THIS METHOD (FIXES YOUR ERROR)
  addCitations(content, references = []) {
    const validReferences = references.filter(
      ref => ref && ref.url && !ref.url.includes("example.com")
    );

    if (validReferences.length === 0) {
      return (
        content +
        `\n\n---\n\n*Optimized with Groq AI | ${new Date()
          .toISOString()
          .split("T")[0]}*`
      );
    }

    const citations = validReferences
      .map((ref, index) => `${index + 1}. [${ref.title}](${ref.url})`)
      .join("\n");

    return (
      content +
      `

---
## References
${citations}

*Optimized with Groq AI | ${new Date().toISOString().split("T")[0]}*
`
    );
  }
}

module.exports = new LLMService();

