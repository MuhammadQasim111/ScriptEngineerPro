
import Groq from "groq-sdk";
import { ScriptRequest, ScriptResponse, FailureSimulation, ValueMetrics } from "./types";

const SYSTEM_INSTRUCTION = `You are an AI-powered script engineering system.
Your job is to convert vague human intent into safe, production-ready executable scripts.

🎯 OBJECTIVE
Understand intent, remove ambiguity, choose the safest solution, generate high-quality code.
Output exactly:
1. Summary (one paragraph)
2. Assumptions (bullet list)
3. Script (raw code)
4. Tests (raw code for unit tests, ONLY if requested)
5. Dockerfile (Minimal, production-ready multi-stage Dockerfile)
6. CI/CD (GitHub Actions YAML configuration)
7. Failure Simulations (A list of 3-4 scenarios formatted as: [Scenario] | [Trigger] | [Script Behavior])
8. Value Metrics (Quantify engineering effort avoided: [Time Saved Mins] | [Total Lines] | [Errors Mitigated])
9. Usage (one-liner)

🔒 SAFETY & RESILIENCE (STRICT REQUIREMENT)
- MANDATORY: Include comprehensive error handling.
- MANDATORY: Handle common failure modes: File Not Found, Permission Denied, Network Timeout.
- MANDATORY: Ensure scripts exit cleanly with appropriate non-zero exit codes.

📊 VALUE METRICS (ROI ANALYSIS - CRITICAL)
- You MUST provide realistic, non-zero values that reflect the work of a professional senior engineer.
- Time Saved Mins: Estimate the total time for Research + Architecture + Implementation + Debugging + Testing + Containerization + CI/CD Setup. Typical professional scripts range from 45-240 minutes. NEVER output 0.
- Total Lines: The exact sum of lines in the script, tests, Dockerfile, and CI/CD YAML. This reflects optimized production code volume.
- Errors Mitigated: Count the specific try-catch blocks, if/else checks for null/undefined, file existence checks, and status code verifications you implemented. This reflects explicit error handlers.
- Format: Metrics | [Number] | [Number] | [Number]

🧠 OUTPUT FORMAT (STRICT)
Always output in this exact order:
🧠 Summary: ...
⚙️ Assumptions: ...
📜 Script: ...
🧪 Tests: ... (N/A if not requested)
🐳 Dockerfile: ...
🚀 CI/CD: ...
☢️ Failure Simulations:
- Scenario 1 | Trigger 1 | Behavior 1
...
📊 Metrics | [Mins] | [Lines] | [Errors]
▶️ Usage: ...

Do not include any extra chat or explanation outside these sections.`;

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || "",
    dangerouslyAllowBrowser: true
});

export const generateScript = async (request: ScriptRequest): Promise<ScriptResponse> => {
    const prompt = `
INPUT:
- Description: ${request.description}
- Script Type: ${request.scriptType}
- Language: ${request.language}
- Environment: ${request.environment}
- Safety Level: ${request.safetyLevel}
- Include Tests: ${request.includeTests ? 'YES' : 'NO'}

PROCESS: Calculate ROI metrics based on the complexity of the task. Ensure 'Time Saved' is at least 30 minutes for even simple tasks, accounting for professional standards.
  `.trim();

    try {
        const response = await groq.chat.completions.create({
            messages: [
                { role: "system", content: SYSTEM_INSTRUCTION },
                { role: "user", content: prompt }
            ],
            model: process.env.MODEL_NAME || "llama-3.1-8b-instant",
            temperature: 0.1,
        });

        const text = response.choices[0]?.message?.content || "";
        if (!text) throw new Error("The engine returned an empty response.");

        return parseModelResponse(text);
    } catch (error: any) {
        console.error("Groq API Error:", error);
        throw new Error("Failed to engineer script module. The engine encountered a verification fault.");
    }
};

const parseModelResponse = (text: string): ScriptResponse => {
    const sections: ScriptResponse = {
        summary: "",
        assumptions: [],
        script: "",
        tests: "",
        dockerfile: "",
        cicd: "",
        failureSimulations: [],
        metrics: { timeSavedMinutes: 0, linesProduced: 0, potentialErrorsMitigated: 0 },
        usage: ""
    };

    const lines = text.split('\n');
    let currentSection: string | null = null;
    let inCodeBlock = false;

    lines.forEach(line => {
        const trimmed = line.trim();

        if (trimmed.includes('🧠 Summary')) {
            currentSection = 'summary';
            sections.summary = trimmed.replace(/.*?🧠 Summary:?\s*/, '').trim();
        } else if (trimmed.includes('⚙️ Assumptions')) {
            currentSection = 'assumptions';
        } else if (trimmed.includes('📜 Script')) {
            currentSection = 'script';
            inCodeBlock = false;
        } else if (trimmed.includes('🧪 Tests')) {
            currentSection = 'tests';
            inCodeBlock = false;
        } else if (trimmed.includes('🐳 Dockerfile')) {
            currentSection = 'dockerfile';
            inCodeBlock = false;
        } else if (trimmed.includes('🚀 CI/CD')) {
            currentSection = 'cicd';
            inCodeBlock = false;
        } else if (trimmed.includes('☢️ Failure Simulations')) {
            currentSection = 'failures';
        } else if (trimmed.includes('📊 Metrics')) {
            const parts = trimmed.split('|').map(p => p.trim());
            if (parts.length >= 4) {
                sections.metrics = {
                    timeSavedMinutes: parseInt(parts[1]) || 30,
                    linesProduced: parseInt(parts[2]) || 0,
                    potentialErrorsMitigated: parseInt(parts[3]) || 5
                };
            }
        } else if (trimmed.includes('▶️ Usage')) {
            currentSection = 'usage';
            sections.usage = trimmed.replace(/.*?▶️ Usage:?\s*/, '').trim();
        } else if (currentSection === 'summary' && trimmed) {
            if (!sections.summary.includes(trimmed)) {
                sections.summary += (sections.summary ? ' ' : '') + trimmed;
            }
        } else if (currentSection === 'assumptions' && trimmed.startsWith('-')) {
            sections.assumptions.push(trimmed.substring(1).trim());
        } else if (currentSection === 'failures' && trimmed.startsWith('-')) {
            const parts = trimmed.substring(1).split('|').map(p => p.trim());
            if (parts.length >= 3) {
                sections.failureSimulations.push({
                    scenario: parts[0],
                    trigger: parts[1],
                    behavior: parts[2]
                });
            }
        } else if (['script', 'tests', 'dockerfile', 'cicd'].includes(currentSection || '')) {
            if (trimmed.startsWith('```')) {
                inCodeBlock = !inCodeBlock;
            } else {
                if (currentSection === 'script') sections.script += line + '\n';
                if (currentSection === 'tests') sections.tests += line + '\n';
                if (currentSection === 'dockerfile') sections.dockerfile += line + '\n';
                if (currentSection === 'cicd') sections.cicd += line + '\n';
            }
        } else if (currentSection === 'usage' && trimmed && !trimmed.includes('▶️ Usage')) {
            sections.usage += (sections.usage ? ' ' : '') + trimmed;
        }
    });

    sections.script = sections.script.trim();
    sections.tests = (sections.tests || "").trim();
    sections.dockerfile = (sections.dockerfile || "").trim();
    sections.cicd = (sections.cicd || "").trim();
    if (sections.tests === 'N/A') sections.tests = "";

    return sections;
};
