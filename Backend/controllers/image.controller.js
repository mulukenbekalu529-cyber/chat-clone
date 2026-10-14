export const generateImage = async (req, res) => {
  try {
    const { prompt } = req.body;

    // Validate the user's image description
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide an image description.",
      });
    }

    const idea = prompt.trim();

    // Prepare a detailed prompt for an image-generation tool
    const improvedPrompt = [
      `Create an image based on the following description: ${idea}`,
      "",
      "Visual style:",
      "- Cinematic digital artwork",
      "- High-quality details and realistic textures",
      "- Balanced composition with a clear focal point",
      "- Lighting that matches the mood of the scene",
      "- A detailed background that complements the subject",
      "- Harmonious colors and professional visual quality",
      "",
      "Important:",
      "- Keep the main subject clear and recognizable",
      "- Avoid unnecessary objects and visual clutter",
      "- Make the final composition visually appealing",
    ].join("\n");

    return res.status(200).json({
      success: true,
      message: "Image prompt prepared successfully.",
      data: {
        prompt: improvedPrompt,
        generatedImage: null,
        note: "Your image prompt is ready to copy into an image-generation tool. No image file was generated.",
      },
    });
  } catch (error) {
    console.error("Image prompt error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to prepare the image prompt.",
    });
  }
};
