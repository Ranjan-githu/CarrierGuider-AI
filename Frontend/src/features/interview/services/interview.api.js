import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://carrierguider-ai-2.onrender.com";

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
})


/**
 * @description Service to generate interview report based on user self description, resume and job description.
 */
export const generateInterviewReport = async ({ jobDescription, selfDescription, resumeFile }) => {

    console.log("interview.api: generateInterviewReport called")
    const formData = new FormData()
    formData.append("jobDescription", jobDescription)
    formData.append("selfDescription", selfDescription)
    if (resumeFile) {
        formData.append("resume", resumeFile)
    }

    console.log("interview.api: making request to /api/interview/")
    const response = await api.post("/api/interview/", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    })

    console.log("interview.api: response received", response.data)
    return response.data

}


/**
 * @description Service to get interview report by interviewId.
 */
export const getInterviewReportById = async (interviewId) => {
    const response = await api.get(`/api/interview/report/${interviewId}`)

    return response.data
}


/**
 * @description Service to get all interview reports of logged in user.
 */
export const getAllInterviewReports = async () => {
    const response = await api.get("/api/interview/")

    return response.data
}


/**
 * @description Service to generate resume pdf based on user self description, resume content and job description.
 */
export const generateResumePdf = async ({ interviewReportId }) => {
    const response = await api.post(`/api/interview/resume/pdf/${interviewReportId}`, null, {
        responseType: "blob"
    })

    return response.data
}