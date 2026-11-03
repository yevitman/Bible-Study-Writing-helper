import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper: Ensure Gemini client can be called safely
function checkApiKey(res: express.Response): boolean {
  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({
      error: 'GEMINI_API_KEY 환경 변수가 설정되지 않았습니다. Settings > Secrets에서 키를 확인해 주세요.',
    });
    return false;
  }
  return true;
}

// 1. Generate Complete Bible Study Manuscript
app.post('/api/gemini/generate-study', async (req, res) => {
  if (!checkApiKey(res)) return;

  try {
    const {
      passage,
      topic,
      targetAudience,
      studyType,
      tone,
      specialRequests,
    } = req.body;

    const systemInstruction = `당신은 탁월한 신학적 통찰과 목회적 온기를 겸비한 성경공부 교재 및 강해 원고 전문 집필가입니다.
복음주의적이고 성경 중심적인 균형 잡힌 주해(Exegesis)와 오늘날 성도들의 삶에 깊이 와닿는 실제적인 적용(Application)을 갖춘 완전한 성경공부 교재 원고를 한국어로 집필합니다.
사용자가 제공한 본문, 주제, 대상, 모임 유형을 바탕으로 체계적이고 바로 현장에서 인도할 수 있을 만큼 완벽한 JSON 구조로 응답해야 합니다.`;

    const prompt = `다음 조건에 맞춰 풍성하고 깊이 있는 성경공부 원고를 작성해 주세요:
- 성경 본문: ${passage || '지정되지 않음 (주제에 맞는 핵심 본문 선정)'}
- 핵심 주제/제목: ${topic || '본문에 가장 적합한 은혜로운 주제'}
- 스터디 대상: ${targetAudience || '장년 및 청년 일반'}
- 모임 형태: ${studyType || '소그룹 성경공부'}
- 진행 톤 & 관점: ${tone || '은혜롭고 실천적인 톤'}
${specialRequests ? `- 특별 요청사항: ${specialRequests}` : ''}

반드시 요청된 JSON 스키마 규격에 맞춰 상세하고 완성도 높은 원고를 생성해 주세요. 각 대지(outline)는 3대지로 구성하고 성경적 해설과 나눔 질문을 명확히 제시하세요.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: '성경공부 제목' },
            subtitle: { type: Type.STRING, description: '부제 또는 핵심 메시지 한 문장' },
            passage: { type: Type.STRING, description: '확정된 성경 본문 구절 (예: 로마서 8:28-39)' },
            keyVerse: { type: Type.STRING, description: '핵심 요절 성경 말씀과 구절' },
            targetAudience: { type: Type.STRING, description: '대상 그룹' },
            estimatedTimeMinutes: { type: Type.INTEGER, description: '예상 소요 시간(분, 예: 45)' },
            iceBreaker: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: '도입 질문 제목' },
                question: { type: Type.STRING, description: '마음을 여는 아이스브레이킹 질문' },
                illustration: { type: Type.STRING, description: '도입 예화 또는 배경 이야기' },
              },
              required: ['title', 'question', 'illustration'],
            },
            historicalContext: {
              type: Type.OBJECT,
              properties: {
                background: { type: Type.STRING, description: '저자, 수신자, 역사적/문화적 배경 해설' },
                theologicalTheme: { type: Type.STRING, description: '본문의 신학적 핵심 주제' },
              },
              required: ['background', 'theologicalTheme'],
            },
            wordStudies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  originalWord: { type: Type.STRING, description: '히브리어 또는 헬라어 원어(한글 발음 포함)' },
                  meaning: { type: Type.STRING, description: '원어의 사전적/신학적 깊은 의미' },
                  insight: { type: Type.STRING, description: '이 단어가 본문에서 주는 영적 교훈과 통찰' },
                },
                required: ['originalWord', 'meaning', 'insight'],
              },
            },
            outlines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  pointNumber: { type: Type.INTEGER, description: '대지 번호 (1, 2, 3)' },
                  title: { type: Type.STRING, description: '대지 소제목 (예: 1. 하나님의 변함없는 섭리를 신뢰하십시오)' },
                  verses: { type: Type.STRING, description: '해당 절 (예: 28-30절)' },
                  exegesis: { type: Type.STRING, description: '본문 강해 및 깊은 성경적 해설 (풍성하게)' },
                  modernAnalogy: { type: Type.STRING, description: '현대 성도들의 일상과 연결되는 비유나 예화' },
                  discussionQuestion: { type: Type.STRING, description: '이 대지와 관련된 조원 나눔 질문' },
                },
                required: ['pointNumber', 'title', 'verses', 'exegesis', 'discussionQuestion'],
              },
            },
            deepQuestions: {
              type: Type.OBJECT,
              properties: {
                observation: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '관찰 질문 (본문 팩트 확인)',
                },
                interpretation: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '해석 질문 (영적 의미 탐구)',
                },
                application: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '적용 질문 (삶의 실천)',
                },
              },
              required: ['observation', 'interpretation', 'application'],
            },
            lifeApplication: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  domain: { type: Type.STRING, description: '적용 영역 (예: 개인 신앙, 가정/관계, 일터/사회)' },
                  actionItem: { type: Type.STRING, description: '구체적인 실천 행동 과제' },
                },
                required: ['domain', 'actionItem'],
              },
            },
            closingPrayer: { type: Type.STRING, description: '함께 합심하여 드릴 수 있는 은혜로운 마침 기도문' },
            participantHandout: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING, description: '참여자용 1페이지 요약 가이드' },
                fillInTheBlanks: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '참여자가 빈칸을 채우며 듣는 묵상 문장 (예: 하나님은 모든 것을 합력하여 [ ___ ]을(를) 이루십니다)'
                },
                weeklyMission: { type: Type.STRING, description: '한 주간의 생활 속 영적 미션' },
              },
              required: ['summary', 'fillInTheBlanks', 'weeklyMission'],
            },
          },
          required: [
            'title',
            'passage',
            'keyVerse',
            'iceBreaker',
            'historicalContext',
            'wordStudies',
            'outlines',
            'deepQuestions',
            'lifeApplication',
            'closingPrayer',
            'participantHandout',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Error generating Bible study:', err);
    res.status(500).json({ error: err.message || '성경공부 원고 생성 중 오류가 발생했습니다.' });
  }
});

// 2. Generate Focused Illustrations / Parables
app.post('/api/gemini/generate-illustration', async (req, res) => {
  if (!checkApiKey(res)) return;

  try {
    const { passage, theme, targetAudience, style } = req.body;
    const prompt = `성경 본문 "${passage || '자유'}" 및 주제 "${theme}"에 대해, 대상(${targetAudience || '모든 성도'})에 맞춘 감동적이고 기억에 남는 예화/비유 3가지를 생성해 주세요.
스타일: ${style || '현대적 일상/역사적 실화/따뜻한 감동'}
각 예화는 제목, 이야기 내용, 성경 말씀과의 연결점(포인트)을 포함해 주세요.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.75,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              category: { type: Type.STRING, description: '예: 현대 일상, 역사적 일화, 자연과 과학 비유 등' },
              story: { type: Type.STRING, description: '구체적이고 몰입감 있는 이야기' },
              biblicalBridge: { type: Type.STRING, description: '이 예화가 오늘 본문과 어떻게 연결되는지 설명' },
            },
            required: ['title', 'category', 'story', 'biblicalBridge'],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    res.json({ illustrations: parsed });
  } catch (err: any) {
    console.error('Error generating illustrations:', err);
    res.status(500).json({ error: err.message || '예화 생성 실패' });
  }
});

// 3. Original Language Word Study (Greek/Hebrew)
app.post('/api/gemini/generate-word-study', async (req, res) => {
  if (!checkApiKey(res)) return;

  try {
    const { passage, keyword } = req.body;
    const prompt = `본문 "${passage}" 또는 키워드 "${keyword}"에 대한 성경 원어(히브리어/헬라어) 심층 분석 연구를 제공해 주세요.
원어 표기, 한글 발음, 스트롱 번호(Strong's number), 본문에서의 문법적/신학적 쓰임새, 성경의 다른 중요한 용례, 묵상 및 설교/가르침에 적용할 수 있는 통찰을 3개 단어 안팎으로 상세히 정리해 주세요.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.5,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING, description: '원어 문자 및 한글 음독' },
              language: { type: Type.STRING, description: '히브리어 또는 헬라어' },
              strongNumber: { type: Type.STRING, description: '스트롱 코드 (예: H2617, G26)' },
              literalMeaning: { type: Type.STRING, description: '직역 및 기본 의미' },
              theologicalDepth: { type: Type.STRING, description: '신학적 깊이와 뉘앙스 해설' },
              otherVerses: { type: Type.ARRAY, items: { type: Type.STRING }, description: '동일 어근이 쓰인 대표 구절' },
              teachingTip: { type: Type.STRING, description: '교인들에게 쉽게 설명하고 가르치는 팁' },
            },
            required: ['word', 'language', 'literalMeaning', 'theologicalDepth', 'teachingTip'],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    res.json({ wordStudies: parsed });
  } catch (err: any) {
    console.error('Error generating word study:', err);
    res.status(500).json({ error: err.message || '원어 연구 생성 실패' });
  }
});

// 4. Generate Multi-Stage Discussion Questions
app.post('/api/gemini/generate-questions', async (req, res) => {
  if (!checkApiKey(res)) return;

  try {
    const { passage, topic, targetAudience, focus } = req.body;
    const prompt = `본문: "${passage}", 주제: "${topic}", 대상: "${targetAudience || '소그룹 성도'}", 집중 영역: "${focus || '삶의 변화와 회복'}".
귀납적 성경연구(Inductive Bible Study) 방식에 따른 풍성한 나눔 질문 세트를 만들어 주세요.
1단계 관찰(Fact), 2단계 해석(Meaning), 3단계 적용(Application & Life Sharing)으로 나누어 소그룹에서 활발한 나눔이 일어나도록 마음을 여는 열린 질문들로 작성해 주세요.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            observationQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  verse: { type: Type.STRING },
                  question: { type: Type.STRING },
                  guideForLeader: { type: Type.STRING, description: '인도자를 위한 팁' },
                },
                required: ['verse', 'question'],
              },
            },
            interpretationQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  intent: { type: Type.STRING, description: '질문의 의도' },
                  guideForLeader: { type: Type.STRING },
                },
                required: ['question', 'intent'],
              },
            },
            applicationQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  sharingTip: { type: Type.STRING, description: '솔직하고 부담 없는 나눔을 돕는 조언' },
                },
                required: ['question'],
              },
            },
          },
          required: ['observationQuestions', 'interpretationQuestions', 'applicationQuestions'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Error generating questions:', err);
    res.status(500).json({ error: err.message || '나눔 질문 생성 실패' });
  }
});

// 5. Refine/Polish or Rewrite specific text block
app.post('/api/gemini/refine-text', async (req, res) => {
  if (!checkApiKey(res)) return;

  try {
    const { originalText, actionType, instruction } = req.body;
    // actionType: 'warm_grace' | 'theological_depth' | 'expand' | 'summarize' | 'conversational' | 'custom'

    let systemPrompt = '당신은 성경공부 교재와 강해 설교 원고 전문 에디터입니다. 주어진 한국어 텍스트를 목회적, 교육적 목적에 맞게 다듬습니다.';
    let prompt = `원본 텍스트:\n"""\n${originalText}\n"""\n\n`;

    switch (actionType) {
      case 'warm_grace':
        prompt += '요청: 위 원고를 더욱 따뜻하고 위로가 넘치는 은혜로운 목회적 어조로 다시 다듬어 주세요. 성도들의 마음에 깊은 평안을 줄 수 있도록 표현을 유려하게 정돈하세요.';
        break;
      case 'theological_depth':
        prompt += '요청: 위 원고에 성경적/신학적 깊이를 더해 주세요. 성경의 맥락과 언약적 통찰이 드러나도록 탄탄하게 보강해 주세요.';
      case 'expand':
        prompt += '요청: 위 원고의 핵심 논지를 살리면서 더 구체적인 예시와 성경적 해설을 덧붙여 풍성하게 확장(증보)해 주세요.';
        break;
      case 'summarize':
        prompt += '요청: 위 원고의 핵심을 놓치지 않으면서 요점 중심의 간결하고 명확한 요약본으로 축약해 주세요.';
        break;
      case 'conversational':
        prompt += '요청: 소그룹에서 인도자가 친근하게 대화하듯 편안한 구어체/나눔 말투(~해요, ~있지요)로 자연스럽게 바꾸어 주세요.';
        break;
      default:
        prompt += `요청: ${instruction || '원고를 더 매끄럽고 은혜롭게 개선해 주세요.'}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.65,
      },
    });

    res.json({ refinedText: response.text });
  } catch (err: any) {
    console.error('Error refining text:', err);
    res.status(500).json({ error: err.message || '원고 수정 중 오류가 발생했습니다.' });
  }
});

// 6. Cross references finder
app.post('/api/gemini/cross-references', async (req, res) => {
  if (!checkApiKey(res)) return;

  try {
    const { passage, theme } = req.body;
    const prompt = `본문 "${passage}" 및 핵심 주제 "${theme}"와 밀접하게 연결되는 성경 전권의 상호참조(Cross-references) 구절 4~5개를 찾아 해설해 주세요.
구약의 예표와 신약의 성취, 혹은 공관복음의 병행 구절, 사도 바울의 서신서 교훈 등 유기적인 성경의 통일성이 드러나도록 설명해 주세요.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.4,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              verseReference: { type: Type.STRING, description: '성경 장절 (예: 이사야 53:4-6)' },
              testament: { type: Type.STRING, description: '구약 / 신약' },
              verseSummary: { type: Type.STRING, description: '해당 말씀 핵심 내용' },
              connectionInsight: { type: Type.STRING, description: '현재 본문/주제와의 영적 연관성 해설' },
            },
            required: ['verseReference', 'testament', 'connectionInsight'],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    res.json({ crossReferences: parsed });
  } catch (err: any) {
    console.error('Error generating cross references:', err);
    res.status(500).json({ error: err.message || '상호참조 생성 실패' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// Serve frontend with Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    const publicPath = path.resolve(__dirname, 'public');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
    }
    if (fs.existsSync(publicPath)) {
      app.use(express.static(publicPath));
    }
    app.get('*', (req, res) => {
      const distIndex = path.resolve(distPath, 'index.html');
      if (fs.existsSync(distIndex)) {
        res.sendFile(distIndex);
      } else {
        res.sendFile(path.resolve(publicPath, 'index.html'));
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT} in ${isProduction ? 'production' : 'development'} mode`);
  });
}

startServer();
