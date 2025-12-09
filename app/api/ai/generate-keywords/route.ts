import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

interface GenerateKeywordsRequest {
    mood: string;
    ingredients: string[];
    maxCookingTime: number;
}

export async function POST(req: NextRequest) {
    try {
        const { mood, ingredients, maxCookingTime }: GenerateKeywordsRequest = await req.json()

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

        const prompt = `
            あなたは料理動画検索のアシスタントです。
            ユーザーの入力から、YouTube検索に適した日本語のキーワードを生成してください。

            # ユーザー入力
            気分: ${mood}
            食材: ${ingredients.join(', ')}
            調理時間: ${maxCookingTime}分以内

            # 指示
            - 簡潔で検索に適したキーワードを生成
            - 食材名は必ず含める
            - 「簡単」「時短」などの修飾語を適切に追加
            - 1つのキーワード文字列として生成（スペース区切り）

            # 出力形式
            必ずJSON形式で返してください:
            {"keyword": "検索キーワード"}

            # 例
            入力: 気分「疲れてて簡単なものがいい」、食材「鶏肉、トマト」、時間「20分」
            出力: {"keyword": "鶏肉 トマト 簡単 時短"}
        `;

        const result = await model.generateContent(prompt)
        const responseText = result.response.text()

        const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(jsonText);
        
        return NextResponse.json(parsed);

    } catch (error) {
        console.error('Gemini APIエラー', error)
        return NextResponse.json(
            { error: 'キーワードの生成に失敗しました'},
            { status: 500 }
        )
    }
}