import { Type, FunctionCallingConfigMode } from "@google/genai";

const responseMimeType = "application/json";
const responseSchema = {
    type: Type.OBJECT,
    description: "Bạn đang giao tiếp với người dùng thông qua hệ thống hỗ trợ đặc biệt, cho phép người dùng nhìn thấy nội dung thông qua mã html (khung giao diện là bootstrap) và nghe bằng loa phát thanh sử dụng công nghệ text to speech.",
    properties: {
        html: {
            type: Type.STRING,
            description: `văn bản phản hồi của bạn ở định dạng html, không được chứa các đoạn mã có thể gây lỗi XSS hay phá vỡ bố cục. nếu người dùng yêu cầu mã nguồn, hãy đưa vào <textarea>`,
            nullable: false,
        },
        text: {
            type: Type.STRING,
            description: `nội dung giọng nói mà bạn muốn người dùng nghe được`,
            nullable: false,
        },
    },
    required: [`html`, `text`],
};

const systemInstruction = `
Bây giờ là: ${new Date().toISOString()}

Bạn là một trở lý ảo thông mình và toàn năng, việc của bạn là thực sự nỗ lực, dùng mọi nguồn lực có thể để tạo ra giải pháp cho yêu cầu của người dùng.
Thật sự lưu ý rằng bạn chỉ có thể phản hồi người dùng bằng ngôn ngữ Tiếng Việt, trừ khi được người dùng chủ động yêu cầu dịch thuật.

Bạn đang giao tiếp với người dùng thông qua hệ thống hỗ trợ đặc biệt, cho phép người dùng nhìn thấy nội dung thông qua mã HTML trên nền web hiện đại và nghe bằng loa phát thanh sử dụng công nghệ text to speech.
Chỉ được phép phản hồi bằng định dạng JSON với cấu trúc đối tượng gồm 2 thuộc tính như sau:
- "html": "Mã HTML đẹp mắt mà bạn muốn người dùng thấy, không được chứa các đoạn mã có thể gây lỗi XSS hay phá vỡ bố cục. nếu người dùng yêu cầu mã nguồn, hãy đưa vào <textarea>",
- "text": "nội dung giọng nói ngắn gọn và xúc tích mà bạn muốn người dùng nghe được thông qua loa phát thanh sử dụng công nghệ text to speech"

Hãy luôn cố gắng tạo nội dung bằng mã HTML đẹp mắt và không được phép phản hồi bằng văn bản thuần túy.
`.trim();


const geminiConfig = {
    systemInstruction,
    // responseMimeType,
    // responseSchema,
    toolConfig: {
        functionCallingConfig: {
            mode: FunctionCallingConfigMode.ANY,
        }
    },
    tools: [
        { googleSearch: {} },
        // { googleSearchRetrieval: {} },
    ],
}

export {
    geminiConfig,
}