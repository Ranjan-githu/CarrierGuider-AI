const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const puppeteer = require("puppeteer");

console.log("GOOGLE_GENAI_API_KEY is set?", !!process.env.GOOGLE_GENAI_API_KEY);
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

const interviewReportSchema = z.object({
  matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job description"),
  technicalQuestions: z.array(
    z.object({
      question: z.string().describe("The technical question that can be asked in the interview"),
      intention: z.string().describe("The intention of the interviewer behind asking this question"),
      answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc."),
    })
  ).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
  behavioralQuestions: z.array(
    z.object({
      question: z.string().describe("The behavioral question that can be asked in the interview"),
      intention: z.string().describe("The intention of the interviewer behind asking this question"),
      answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc."),
    })
  ).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
  skillGaps: z.array(
    z.object({
      skill: z.string().describe("The skill which the candidate is lacking"),
      severity: z.enum(["low", "medium", "high"]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances"),
    })
  ).describe("List of skill gaps in the candidate's profile along with their severity"),
  preparationPlan: z.array(
    z.object({
      day: z.number().describe("The day number in the preparation plan, starting from 1"),
      focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
      tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc."),
    })
  ).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
  title: z.string().describe("The title of the job for which the interview report is generated"),
});

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
  try {
    console.log("AI service: generateInterviewReport called");
    const prompt = `Generate an interview report for a candidate with the following details:
Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}
`;

    console.log("AI service: calling generateContent");
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: zodToJsonSchema(interviewReportSchema),
      },
    });

    console.log("AI service: received response text", response.text);
    const parsed = JSON.parse(response.text);
    console.log("AI service: parsed JSON", parsed);
    return parsed;
  } catch (err) {
    console.error("=== ERROR in generateInterviewReport ===");
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
    if (err.response) {
      console.error("Response data:", err.response.data);
    }
    throw err;
  }
}



async function generatePdfFromHtml(htmlContent) {
  console.log("generatePdfFromHtml: launching puppeteer");
  const browser = await puppeteer.launch({
    headless: true,
  });
  const page = await browser.newPage();
  console.log("generatePdfFromHtml: setting page content");
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  console.log("generatePdfFromHtml: generating PDF");
  const pdfBuffer = await page.pdf({
    format: "A4",
    margin: {
      top: "20mm",
      bottom: "20mm",
      left: "15mm",
      right: "15mm",
    },
  });

  console.log("generatePdfFromHtml: closing browser");
  await browser.close();

  return pdfBuffer;
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
  try {
    console.log("generateResumePdf: called");
    const resumePdfSchema = z.object({
      html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer"),
    });

    const prompt = `Generate resume for a candidate with the following details:
Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}

The response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
The content of the resume should not sound like it's generated by AI and should be as close as possible to a real human-written resume.
You can highlight the content using some colors or different font styles but the overall design should be simple and professional.
The content should be ATS friendly, i.e., it should be easily parsable by ATS systems without losing important information.
The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
`;

    console.log("generateResumePdf: calling generateContent");
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: zodToJsonSchema(resumePdfSchema),
      },
    });

    console.log("generateResumePdf: parsing response");
    const jsonContent = JSON.parse(response.text);

    console.log("generateResumePdf: calling generatePdfFromHtml");
    const pdfBuffer = await generatePdfFromHtml(jsonContent.html);

    return pdfBuffer;
  } catch (err) {
    console.error("=== ERROR in generateResumePdf ===");
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
    throw err;
  }
}

module.exports = { generateInterviewReport, generateResumePdf }