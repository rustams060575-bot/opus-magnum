/** Copy for the guide (LocalGuide + chat UI), per language. Any missing language falls back to English. */
export interface AgentText {
  ui: {
    open: string;
    title: string;
    sub: string;
    placeholder: string;
    send: string;
    close: string;
    disclaimer: string;
    typing: string;
    save: string;
    saved: string;
    error: string;
    retry: string;
  };
  moodQ: string;
  /** calm, tense, tired, curious, heavy */
  moods: [string, string, string, string, string];
  moodReply: [string, string, string, string, string];
  hello: string; // {t} = stage title
  helloGeneral: string;
  ask: string; // {q}
  nowStage: string; // {t}
  ack: string[];
  follow: string[];
  quote: string; // {x}
  wrap: string;
  care: string;
  generalQ: string;
}

export const agentTexts: Record<string, AgentText> = {
  en: {
    ui: {
      open: 'Talk it through',
      title: 'Your guide',
      sub: 'A quiet conversation about this stage',
      placeholder: 'Write what comes to mind…',
      send: 'Send',
      close: 'Close',
      disclaimer: 'The guide is a companion for reflection, not a doctor or a therapist. In a crisis, please reach a person near you.',
      typing: 'The guide is thinking',
      save: 'Save this thought to my notes',
      saved: 'Saved to your notes',
      error: 'The guide could not answer just now.',
      retry: 'Try again',
    },
    moodQ: 'How are you right now?',
    moods: ['Calm', 'Tense', 'Tired', 'Curious', 'Heavy'],
    moodReply: [
      'Good — a calm moment is a fine place to look inward.',
      'Thank you for saying so. Tension is information, not a verdict. We can go slowly.',
      'Tiredness counts too. Nothing here has to be done quickly.',
      'Curiosity is a good companion on this road.',
      'Thank you for being honest. Heavy days deserve gentleness. We will go at your pace.',
    ],
    hello: 'Hello. I am here to walk beside you through “{t}”. There are no right answers.',
    helloGeneral: 'Hello. I am here to keep you company on this journey. There are no right answers.',
    ask: 'Here is a question to hold gently: {q}',
    nowStage: 'We are now at “{t}”.',
    ack: ['I hear you.', 'Thank you for sharing that.', 'That sounds like it matters.', 'It takes honesty to put that into words.'],
    follow: [
      'What do you notice in your body as you say it?',
      'What would be a small, kind step toward yourself?',
      'Who or what in your life supports you here?',
      'If a friend said this to you, what would you answer them?',
    ],
    quote: 'You said: “{x}”.',
    wrap: 'We can pause here. Would you like to keep one thought from this conversation?',
    care: 'I am really glad you told me. This sounds heavy, and you deserve real human support right now. Please reach someone close to you today — a family member, a friend, a doctor or a local support service. You do not have to carry this alone. I am here too, and we can keep talking.',
    generalQ: 'What brought you here today?',
  },
  ru: {
    ui: {
      open: 'Поговорить',
      title: 'Твой проводник',
      sub: 'Тихий разговор об этой стадии',
      placeholder: 'Напиши, что приходит в голову…',
      send: 'Отправить',
      close: 'Закрыть',
      disclaimer: 'Проводник — спутник для размышлений, а не врач и не психотерапевт. В трудную минуту обратись к живому человеку рядом.',
      typing: 'Проводник думает',
      save: 'Сохранить эту мысль в заметки',
      saved: 'Сохранено в заметки',
      error: 'Проводник сейчас не смог ответить.',
      retry: 'Попробовать ещё раз',
    },
    moodQ: 'Как ты сейчас?',
    moods: ['Спокойно', 'Напряжённо', 'Устал(а)', 'Любопытно', 'Тяжело'],
    moodReply: [
      'Хорошо — в спокойную минуту удобно заглянуть внутрь.',
      'Спасибо, что сказал(а). Напряжение — это информация, а не приговор. Пойдём медленно.',
      'Усталость тоже имеет значение. Здесь ничего не нужно делать быстро.',
      'Любопытство — хороший спутник на этом пути.',
      'Спасибо за честность. Тяжёлым дням нужна бережность. Мы пойдём в твоём темпе.',
    ],
    hello: 'Здравствуй. Я рядом, чтобы пройти вместе с тобой стадию «{t}». Правильных ответов здесь нет.',
    helloGeneral: 'Здравствуй. Я рядом, чтобы составить тебе компанию на этом пути. Правильных ответов здесь нет.',
    ask: 'Вот вопрос, который можно держать бережно: {q}',
    nowStage: 'Теперь мы на стадии «{t}».',
    ack: ['Я тебя слышу.', 'Спасибо, что поделился(лась).', 'Похоже, это важно.', 'Нужна честность, чтобы сказать это словами.'],
    follow: [
      'Что ты замечаешь в теле, когда говоришь это?',
      'Какой маленький добрый шаг к себе возможен сейчас?',
      'Кто или что в твоей жизни поддерживает тебя в этом?',
      'Если бы друг сказал тебе такое, что бы ты ему ответил(а)?',
    ],
    quote: 'Ты сказал(а): «{x}».',
    wrap: 'Здесь можно сделать паузу. Хочешь сохранить одну мысль из нашего разговора?',
    care: 'Я очень рад(а), что ты это сказал(а). Звучит тяжело, и сейчас тебе нужна настоящая человеческая поддержка. Пожалуйста, обратись сегодня к кому-то рядом: близкому, другу, врачу или местной службе помощи. Тебе не нужно нести это одному(ной). Я тоже здесь, и мы можем продолжить разговор.',
    generalQ: 'Что привело тебя сюда сегодня?',
  },
  es: {
    ui: {
      open: 'Hablarlo',
      title: 'Tu guía',
      sub: 'Una conversación tranquila sobre esta etapa',
      placeholder: 'Escribe lo que te venga a la mente…',
      send: 'Enviar',
      close: 'Cerrar',
      disclaimer: 'La guía es una compañía para reflexionar, no un médico ni un terapeuta. En una crisis, acude a una persona cercana.',
      typing: 'La guía está pensando',
      save: 'Guardar este pensamiento en mis notas',
      saved: 'Guardado en tus notas',
      error: 'La guía no pudo responder ahora.',
      retry: 'Intentar de nuevo',
    },
    moodQ: '¿Cómo estás ahora?',
    moods: ['Tranquilo/a', 'Tenso/a', 'Cansado/a', 'Curioso/a', 'Pesado'],
    moodReply: [
      'Bien: un momento de calma es bueno para mirar hacia dentro.',
      'Gracias por decirlo. La tensión es información, no una sentencia. Iremos despacio.',
      'El cansancio también cuenta. Aquí nada tiene que hacerse deprisa.',
      'La curiosidad es una buena compañera en este camino.',
      'Gracias por tu sinceridad. Los días pesados merecen delicadeza. Iremos a tu ritmo.',
    ],
    hello: 'Hola. Estoy aquí para acompañarte en «{t}». No hay respuestas correctas.',
    helloGeneral: 'Hola. Estoy aquí para acompañarte en este viaje. No hay respuestas correctas.',
    ask: 'Una pregunta para sostener con suavidad: {q}',
    nowStage: 'Ahora estamos en «{t}».',
    ack: ['Te escucho.', 'Gracias por compartirlo.', 'Parece importante.', 'Hace falta honestidad para decir eso.'],
    follow: [
      '¿Qué notas en el cuerpo al decirlo?',
      '¿Cuál sería un pequeño paso amable hacia ti?',
      '¿Quién o qué te apoya en esto?',
      'Si un amigo te dijera esto, ¿qué le responderías?',
    ],
    quote: 'Dijiste: «{x}».',
    wrap: 'Podemos hacer una pausa. ¿Quieres guardar un pensamiento de esta conversación?',
    care: 'Me alegra mucho que lo hayas dicho. Suena pesado y mereces apoyo humano real ahora. Por favor, busca hoy a alguien cercano: familia, un amigo, un médico o un servicio local de ayuda. No tienes que cargarlo solo/a. Yo también estoy aquí y podemos seguir hablando.',
    generalQ: '¿Qué te trajo aquí hoy?',
  },
  uk: {
    ui: {
      open: 'Поговорити',
      title: 'Твій провідник',
      sub: 'Тиха розмова про цю стадію',
      placeholder: 'Напиши, що спадає на думку…',
      send: 'Надіслати',
      close: 'Закрити',
      disclaimer: 'Провідник — супутник для роздумів, а не лікар чи психотерапевт. У скруті звернися до живої людини поруч.',
      typing: 'Провідник думає',
      save: 'Зберегти цю думку в нотатки',
      saved: 'Збережено в нотатки',
      error: 'Провідник зараз не зміг відповісти.',
      retry: 'Спробувати ще раз',
    },
    moodQ: 'Як ти зараз?',
    moods: ['Спокійно', 'Напружено', 'Втомлено', 'Цікаво', 'Важко'],
    moodReply: [
      'Добре — у спокійну хвилину зручно зазирнути всередину.',
      'Дякую, що сказав(ла). Напруга — це інформація, а не вирок. Підемо повільно.',
      'Втома теж має значення. Тут нічого не треба робити швидко.',
      'Цікавість — добрий супутник на цьому шляху.',
      'Дякую за щирість. Важким дням потрібна дбайливість. Ми підемо у твоєму темпі.',
    ],
    hello: 'Вітаю. Я поруч, щоб пройти з тобою стадію «{t}». Правильних відповідей тут немає.',
    helloGeneral: 'Вітаю. Я поруч, щоб скласти тобі компанію на цьому шляху. Правильних відповідей тут немає.',
    ask: 'Ось питання, яке можна тримати дбайливо: {q}',
    nowStage: 'Тепер ми на стадії «{t}».',
    ack: ['Я тебе чую.', 'Дякую, що поділився(лась).', 'Схоже, це важливо.', 'Потрібна щирість, щоб сказати це словами.'],
    follow: [
      'Що ти помічаєш у тілі, коли кажеш це?',
      'Який маленький добрий крок до себе можливий зараз?',
      'Хто або що у твоєму житті підтримує тебе в цьому?',
      'Якби друг сказав тобі таке, що б ти йому відповів(ла)?',
    ],
    quote: 'Ти сказав(ла): «{x}».',
    wrap: 'Тут можна зробити паузу. Хочеш зберегти одну думку з нашої розмови?',
    care: 'Я дуже радий(а), що ти це сказав(ла). Звучить важко, і зараз тобі потрібна справжня людська підтримка. Будь ласка, звернися сьогодні до когось поруч: рідних, друга, лікаря чи місцевої служби допомоги. Тобі не треба нести це самому(ій). Я теж тут, і ми можемо продовжити розмову.',
    generalQ: 'Що привело тебе сюди сьогодні?',
  },
  fr: {
    ui: {
      open: 'En parler',
      title: 'Ton guide',
      sub: 'Une conversation calme sur cette étape',
      placeholder: 'Écris ce qui te vient à l’esprit…',
      send: 'Envoyer',
      close: 'Fermer',
      disclaimer: 'Le guide est un compagnon de réflexion, pas un médecin ni un thérapeute. En cas de crise, tourne-toi vers une personne proche.',
      typing: 'Le guide réfléchit',
      save: 'Garder cette pensée dans mes notes',
      saved: 'Enregistré dans tes notes',
      error: 'Le guide n’a pas pu répondre pour l’instant.',
      retry: 'Réessayer',
    },
    moodQ: 'Comment vas-tu en ce moment ?',
    moods: ['Calme', 'Tendu(e)', 'Fatigué(e)', 'Curieux(se)', 'Lourd'],
    moodReply: [
      'Bien : un moment calme est idéal pour regarder en soi.',
      'Merci de le dire. La tension est une information, pas un verdict. Allons doucement.',
      'La fatigue compte aussi. Rien ici n’est à faire vite.',
      'La curiosité est une bonne compagne sur ce chemin.',
      'Merci pour ta sincérité. Les jours lourds méritent de la douceur. Nous irons à ton rythme.',
    ],
    hello: 'Bonjour. Je suis là pour t’accompagner dans « {t} ». Il n’y a pas de bonne réponse.',
    helloGeneral: 'Bonjour. Je suis là pour te tenir compagnie sur ce voyage. Il n’y a pas de bonne réponse.',
    ask: 'Une question à porter avec douceur : {q}',
    nowStage: 'Nous voici à « {t} ».',
    ack: ['Je t’entends.', 'Merci de l’avoir partagé.', 'Cela semble important.', 'Il faut de l’honnêteté pour le dire.'],
    follow: [
      'Que remarques-tu dans ton corps en le disant ?',
      'Quel petit pas bienveillant vers toi serait possible ?',
      'Qui ou quoi te soutient dans cela ?',
      'Si un ami te disait cela, que lui répondrais-tu ?',
    ],
    quote: 'Tu as dit : « {x} ».',
    wrap: 'On peut faire une pause. Veux-tu garder une pensée de cette conversation ?',
    care: 'Je suis vraiment content(e) que tu l’aies dit. Cela semble lourd et tu mérites un vrai soutien humain maintenant. Parle aujourd’hui à quelqu’un de proche : famille, ami, médecin ou service d’aide local. Tu n’as pas à porter cela seul(e). Je suis là aussi et nous pouvons continuer.',
    generalQ: 'Qu’est-ce qui t’amène ici aujourd’hui ?',
  },
  de: {
    ui: {
      open: 'Darüber sprechen',
      title: 'Dein Begleiter',
      sub: 'Ein ruhiges Gespräch über diese Stufe',
      placeholder: 'Schreib, was dir in den Sinn kommt …',
      send: 'Senden',
      close: 'Schließen',
      disclaimer: 'Der Begleiter ist ein Gesprächspartner zum Nachdenken, kein Arzt und kein Therapeut. In einer Krise wende dich bitte an einen Menschen in deiner Nähe.',
      typing: 'Der Begleiter denkt nach',
      save: 'Diesen Gedanken in meinen Notizen speichern',
      saved: 'In deinen Notizen gespeichert',
      error: 'Der Begleiter konnte gerade nicht antworten.',
      retry: 'Erneut versuchen',
    },
    moodQ: 'Wie geht es dir gerade?',
    moods: ['Ruhig', 'Angespannt', 'Müde', 'Neugierig', 'Schwer'],
    moodReply: [
      'Gut – ein ruhiger Moment ist ein guter Zeitpunkt, nach innen zu schauen.',
      'Danke, dass du das sagst. Anspannung ist eine Information, kein Urteil. Wir gehen langsam.',
      'Müdigkeit zählt auch. Hier muss nichts schnell gehen.',
      'Neugier ist ein guter Begleiter auf diesem Weg.',
      'Danke für deine Ehrlichkeit. Schwere Tage verdienen Sanftheit. Wir gehen in deinem Tempo.',
    ],
    hello: 'Hallo. Ich bin da, um dich durch „{t}“ zu begleiten. Es gibt keine richtigen Antworten.',
    helloGeneral: 'Hallo. Ich bin da, um dir auf dieser Reise Gesellschaft zu leisten. Es gibt keine richtigen Antworten.',
    ask: 'Eine Frage, die du sanft halten kannst: {q}',
    nowStage: 'Jetzt sind wir bei „{t}“.',
    ack: ['Ich höre dich.', 'Danke, dass du das teilst.', 'Das scheint wichtig zu sein.', 'Es braucht Ehrlichkeit, das auszusprechen.'],
    follow: [
      'Was nimmst du im Körper wahr, wenn du das sagst?',
      'Was wäre ein kleiner, freundlicher Schritt zu dir selbst?',
      'Wer oder was unterstützt dich dabei?',
      'Wenn ein Freund dir das sagen würde, was würdest du antworten?',
    ],
    quote: 'Du sagtest: „{x}“.',
    wrap: 'Wir können hier eine Pause machen. Möchtest du einen Gedanken aus diesem Gespräch behalten?',
    care: 'Ich bin froh, dass du das gesagt hast. Das klingt schwer, und du verdienst jetzt echte menschliche Unterstützung. Bitte wende dich heute an jemanden in deiner Nähe: Familie, Freunde, eine Ärztin oder einen örtlichen Hilfsdienst. Du musst das nicht allein tragen. Ich bin auch da, und wir können weitersprechen.',
    generalQ: 'Was hat dich heute hierher geführt?',
  },
  pt: {
    ui: {
      open: 'Conversar',
      title: 'Seu guia',
      sub: 'Uma conversa tranquila sobre esta etapa',
      placeholder: 'Escreva o que lhe vier à mente…',
      send: 'Enviar',
      close: 'Fechar',
      disclaimer: 'O guia é uma companhia para refletir, não um médico nem um terapeuta. Numa crise, procure uma pessoa próxima.',
      typing: 'O guia está pensando',
      save: 'Guardar este pensamento nas minhas notas',
      saved: 'Guardado nas suas notas',
      error: 'O guia não conseguiu responder agora.',
      retry: 'Tentar de novo',
    },
    moodQ: 'Como você está agora?',
    moods: ['Calmo(a)', 'Tenso(a)', 'Cansado(a)', 'Curioso(a)', 'Pesado'],
    moodReply: [
      'Bom: um momento calmo é ótimo para olhar para dentro.',
      'Obrigado por dizer. A tensão é informação, não um veredito. Vamos devagar.',
      'O cansaço também conta. Aqui nada precisa ser rápido.',
      'A curiosidade é uma boa companheira neste caminho.',
      'Obrigado pela sinceridade. Dias pesados merecem gentileza. Iremos ao seu ritmo.',
    ],
    hello: 'Olá. Estou aqui para caminhar ao seu lado em «{t}». Não há respostas certas.',
    helloGeneral: 'Olá. Estou aqui para lhe fazer companhia nesta jornada. Não há respostas certas.',
    ask: 'Uma pergunta para guardar com delicadeza: {q}',
    nowStage: 'Agora estamos em «{t}».',
    ack: ['Eu ouço você.', 'Obrigado por compartilhar.', 'Parece importante.', 'É preciso honestidade para dizer isso.'],
    follow: [
      'O que você percebe no corpo ao dizer isso?',
      'Qual seria um pequeno passo gentil em direção a você mesmo(a)?',
      'Quem ou o que apoia você nisso?',
      'Se um amigo dissesse isso a você, o que responderia?',
    ],
    quote: 'Você disse: «{x}».',
    wrap: 'Podemos fazer uma pausa. Quer guardar um pensamento desta conversa?',
    care: 'Fico muito feliz por você ter dito isso. Parece pesado e você merece apoio humano de verdade agora. Procure hoje alguém próximo: família, um amigo, um médico ou um serviço local de ajuda. Você não precisa carregar isso sozinho(a). Eu também estou aqui e podemos continuar conversando.',
    generalQ: 'O que trouxe você aqui hoje?',
  },
};

export const agentFor = (code: string): AgentText => agentTexts[code] ?? agentTexts.en;
