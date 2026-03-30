// APEX — API Proxy Anthropic v2
// Types : program, diet, chat, tip, meal_scan, tdee_advice

export const config = {
  api: { bodyParser: { sizeLimit: '7mb' } }
};

const MODELS = {
  quality: 'claude-sonnet-4-6',
  fast:    'claude-haiku-4-5-20251001'
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY non configurée' });

  try {
    const { type, user, messages, imageData, mediaType, tdeeData } = req.body;
    const u = user || {};

    const userCtx = `Homme ${u.age||33} ans, ${u.weight||76}kg${u.height?', '+u.height+'cm':''}. `
      + `Morphotype : ${u.morphotype||'mésomorphe'}. `
      + `Niveau d'activité : ${u.activity_level||'modérément actif'}. `
      + `Objectif : ${goalLabel(u.goal||'recomposition')}. `
      + `Salle Basic-Fit. ${u.sessions_per_week||3} séances/semaine. `
      + (u.body_fat ? `Masse grasse estimée : ${u.body_fat}%. ` : '');

    let requestBody;

    // ── PROGRAM ──────────────────────────────────────────────
    if (type === 'program') {
      const n = u.sessions_per_week || 3;
      const splits = {
        2:'Full Body ×2 (séances A et B alternées)',
        3:'Full Body ×3 (A/B/C)',
        4:'Upper/Lower ×2 (haut lun/jeu, bas mar/ven)',
        5:'Push/Pull/Legs + 2 Full Body',
        6:'PPL ×2 (Push A/Pull A/Legs A + Push B/Pull B/Legs B)'
      };
      requestBody = {
        model: MODELS.fast,
        max_tokens: 3800,
        system: `Tu es coach sportif expert en hypertrophie et recomposition. ${userCtx}
Règles :
- Débutant (<6 mois) : technique prioritaire, charges modérées, RPE 7-8
- 1 exercice mobilité/gainage par séance en fin
- Varier les types de reps selon exercice et objectif
- Réponds UNIQUEMENT en JSON valide, sans markdown.`,
        messages: [{
          role: 'user',
          content: `Génère ${n} séances/semaine. Split : ${splits[n]||splits[3]}.

Types de reps disponibles :
- "standard" : mouvement contrôlé 2s/2s
- "echec" : jusqu'à défaillance technique (dernière série)
- "tempo" : excentrique 4s, pause 1s, concentrique 2s (-20% charge)
- "pause" : pause 2s en position étirée (-15% charge)
- "dropset" : après l'échec, -30% charge et continuer sans repos (dernier set)
- "isometrique" : contraction statique maintenue (planches etc.)

JSON exact :
{
  "split_name": "Nom court",
  "weekly_note": "Note motivante 2 phrases",
  "sessions": [
    {
      "name": "Séance A — Push",
      "focus": "Pectoraux, épaules, triceps",
      "duration_min": 55,
      "exercises": [
        {
          "name": "Développé couché haltères",
          "muscles": ["Pectoraux","Triceps"],
          "category": "compound",
          "sets": 4,
          "reps": "8-10",
          "rep_type": "standard",
          "rep_type_note": "Dernier set à l'échec si forme parfaite",
          "rest_seconds": 90,
          "tip": "Conseil technique court"
        }
      ]
    }
  ]
}`
        }]
      };

    // ── DIET ─────────────────────────────────────────────────
    } else if (type === 'diet') {
      const tdee = u.tdee_target || null;
      const prot = u.protein_target || Math.round((u.weight||76)*2);
      requestBody = {
        model: MODELS.fast,
        max_tokens: 1000,
        system: `Nutritionniste expert recomposition. ${userCtx} JSON uniquement.`,
        messages: [{
          role: 'user',
          content: `Diète pratique pour ${u.sessions_per_week||3} séances/semaine.
${tdee ? `Calories cibles : ${tdee} kcal/jour.` : ''}
Protéines cibles : ${prot}g.
Objectif : ${goalLabel(u.goal||'recomposition')}.
Sans pesée systématique.

JSON exact :
{
  "protein_g": ${prot},
  "carbs_g": 250,
  "fats_g": 75,
  "calories_approx": ${tdee||2400},
  "water_l": 2.5,
  "meal_timing": [
    {"moment":"Réveil","conseil":"..."},
    {"moment":"Pré-séance","conseil":"..."},
    {"moment":"Post-séance","conseil":"..."},
    {"moment":"Soir","conseil":"..."}
  ],
  "principles": ["règle 1","règle 2","règle 3","règle 4"],
  "pre_workout": "Conseil pré-séance",
  "post_workout": "Conseil post-séance",
  "tip_of_week": "Conseil clé semaine"
}`
        }]
      };

    // ── MEAL SCAN ────────────────────────────────────────────
    } else if (type === 'meal_scan') {
      if (!imageData) return res.status(400).json({ error: 'imageData requis' });
      requestBody = {
        model: MODELS.fast,
        max_tokens: 600,
        system: 'Nutritionniste expert. Si identification incertaine, confidence "faible". JSON uniquement.',
        messages: [{
          role: 'user',
          content: [
            { type:'image', source:{ type:'base64', media_type: mediaType||'image/jpeg', data: imageData } },
            { type:'text', text:`Analyse ce repas. Contexte : ${userCtx}

JSON exact :
{
  "plat_nom": "Nom estimé",
  "calories": 520,
  "proteins_g": 32,
  "carbs_g": 45,
  "fats_g": 18,
  "fiber_g": 5,
  "confidence": "haute",
  "details": "Ingrédients et portions estimés",
  "conseil": "Conseil adapté à l'objectif",
  "score_recomp": 7,
  "suggestions": "1 amélioration simple"
}` }
          ]
        }]
      };

    // ── ALT EXERCISE ─────────────────────────────────────────
    } else if (type === 'alt_exercise') {
      requestBody = {
        model: MODELS.fast,
        max_tokens: 500,
        system: 'Coach sportif expert. Exercices Basic-Fit uniquement. JSON uniquement, sans markdown.',
        messages: [{
          role: 'user',
          content: `Propose 3 alternatives à "${u.exercise_name}" ciblant les mêmes muscles : ${u.muscles?.join(', ')}.
Critères : accessibles à un débutant, faisables à Basic-Fit, même groupe musculaire.

JSON exact :
{
  "alternatives": [
    {
      "name": "Nom de l'exercice",
      "muscles": ["muscle1","muscle2"],
      "sets": 3,
      "reps": "10-12",
      "rest_seconds": 90,
      "rep_type": "standard",
      "tip": "Conseil technique court",
      "why": "Pourquoi c'est plus accessible"
    }
  ]
}`
        }]
      };

    // ── TDEE ADVICE ──────────────────────────────────────────
    } else if (type === 'tdee_advice') {
      const td = tdeeData || {};
      requestBody = {
        model: MODELS.fast,
        max_tokens: 600,
        system: 'Nutritionniste expert composition corporelle. Conseils pratiques, directs. Français, tutoie.',
        messages: [{
          role: 'user',
          content: `Profil : ${userCtx}
Résultats calculés :
- BMR : ${td.bmr} kcal | TDEE : ${td.tdee} kcal | Cible : ${td.target} kcal
- Macros : P ${td.protein_g}g / G ${td.carbs_g}g / L ${td.fats_g}g
- Morphotype : ${td.morphotype}

Donne 3-4 conseils personnalisés pratiques basés sur ces chiffres et ce morphotype. Concret et actionnable.`
        }]
      };

    // ── TIP ──────────────────────────────────────────────────
    } else if (type === 'tip') {
      const topics = ['récupération','sommeil et testostérone','hydratation','progression de charge','timing protéines','mobilité','cortisol et stress','cohérence alimentaire','échauffement'];
      const topic = topics[Math.floor(Math.random()*topics.length)];
      requestBody = {
        model: MODELS.fast,
        max_tokens: 200,
        system: `Coach expert, direct, motivant. ${userCtx} Français, tutoie, 2-3 phrases.`,
        messages: [{ role:'user', content: `Conseil percutant du jour sur : ${topic}` }]
      };

    // ── CHAT ─────────────────────────────────────────────────
    } else {
      requestBody = {
        model: MODELS.fast,
        max_tokens: 500,
        system: `Tu es APEX, coach sportif et nutritionniste. ${userCtx} Français, direct, tutoie, 3-5 phrases max.`,
        messages: (messages||[]).slice(-14)
      };
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'x-api-key':apiKey, 'anthropic-version':'2023-06-01' },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) { const e = await response.text(); return res.status(response.status).json({ error:e }); }
    res.json(await response.json());

  } catch (err) {
    console.error('APEX Error:', err);
    res.status(500).json({ error: err.message });
  }
}

function goalLabel(g) {
  return { recomposition:'recomposition corporelle', prise_masse:'prise de masse propre', seche:'sèche / perte de gras', force:'force' }[g] || g;
}
