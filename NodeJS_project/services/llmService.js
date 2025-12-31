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

  // ✅ EXISTS (already correct)
  buildPrompt(originalArticle, competitorArticles) {
    return `Write a detailed, SEO-optimized article on:
"${originalArticle.title}"`;
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

