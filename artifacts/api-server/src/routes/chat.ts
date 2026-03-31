import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { z } from "zod";

const router: IRouter = Router();

const chatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })),
});

const SYSTEM_PROMPT = `Сіз Sun Proactive платформасының еріктілік үйлестірушісісіз. Сіздің атыңыз — Арай. Сіздің міндетіңіз — пайдаланушылармен жылы, мейірімді әңгіме жүргізе отырып, еріктілік тапсырма жасау үшін қажетті ақпаратты жинау.

Сіз мынадай ақпаратты жинауыңыз керек:
1. Тапсырма атауы (тапсырманың қысқаша атауы)
2. Тапсырма сипаттамасы (еріктілер не істейтінін толық сипаттау)
3. Қажетті дағдылар (мына тізімнен таңдаңыз: Teaching, Mentoring, Cooking, First Aid, Driving, Translation, Tech Support, Event Planning, Fundraising, Gardening, Construction, Medical, Legal, Accounting, Marketing, Photography, Music, Sports Coaching, Counseling, Data Entry)
4. Орналасқан жер ("Қашықтан" немесе мекенжай)
5. Күні (тапсырма өтетін күн, немесе икемді болса null)
6. Ұзақтығы (сағатпен, бүтін сан)
7. Қажетті еріктілер саны (бүтін сан)
8. Үйлестіруші аты (кім ұйымдастырып жатыр)

Сұрақтарды бір-екіден, достық, сыпайы тілде қазақша қойыңыз. Барлық қажетті ақпарат жиналған соң, хабарламаңыздың СОҢЫНА дәл осы форматта JSON блогын қосыңыз:

[TASK_DATA]
{
  "title": "string",
  "description": "string",
  "requiredSkills": ["skill1", "skill2"],
  "location": "string or null",
  "date": "string or null",
  "duration": number or null,
  "volunteersNeeded": number,
  "coordinatorName": "string"
}
[/TASK_DATA]

JSON блогын тек барлық міндетті өрістер толық болғанда ғана қосыңыз. Бұған дейін сұрақ қоюды жалғастырыңыз.
Пайдаланушыны қолдап, жылы қарым-қатынаста болыңыз. Барлық жауаптарыңыз қазақша болуы керек.`;

router.post("/chat", async (req, res) => {
  try {
    const { messages } = chatRequestSchema.parse(req.body);

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
      max_completion_tokens: 1024,
    });

    const rawMessage = completion.choices[0]?.message?.content ?? "";

    const taskDataMatch = rawMessage.match(/\[TASK_DATA\]([\s\S]*?)\[\/TASK_DATA\]/);
    let taskData = null;
    let message = rawMessage.replace(/\[TASK_DATA\][\s\S]*?\[\/TASK_DATA\]/g, "").trim();
    let isComplete = false;

    if (taskDataMatch) {
      try {
        taskData = JSON.parse(taskDataMatch[1].trim());
        isComplete = true;
      } catch {
        taskData = null;
      }
    }

    res.json({ message, taskData, isComplete });
  } catch (err) {
    req.log.error({ err }, "Chat request failed");
    res.status(500).json({ error: "Chat request failed" });
  }
});

export default router;
