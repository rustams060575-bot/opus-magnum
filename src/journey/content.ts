/**
 * Copy for the rituals, the constellation and the "give back" part. EN and RU are written out; the other languages
 * use the English text for now (labelled in the docs as pending translation).
 * Quotations are by C. G. Jung; translations are free renderings and MUST be checked against the editions before release.
 */
export interface JText {
  ui: {
    ritual: string;
    stageWord: string;
    skip: string;
    close: string;
    cont: string;
    chooseStep: string;
    noStep: string;
    next: string;
    consTitle: string;
    consSub: string;
    consEmpty: string;
    openRitual: string;
    card: string;
    remind: string;
    reminded: string;
    giveTitle: string;
    giveSub: string;
    send: string;
    copied: string;
    light: string;
    lightDone: string;
    tomorrow: string;
    tomorrowNone: string;
    heart: string;
    welcome: string;
    quoteNote: string;
    mandalaPick: string;
    stillBreak: string;
    hold: string;
    steps: string;
    drag: string;
    trace: string;
    petalsLeft: string;
    cardTitle: string;
    privacy: string;
  };
  rituals: { title: string; how: string; done: string }[];
  steps: string[][];
  quotes: { q: string; src: string }[];
  warm: string[];
}

const SRC = {
  alch: 'Alchemical Studies (CW 13)',
  arch: 'The Archetypes and the Collective Unconscious (CW 9/I)',
  modern: 'Modern Man in Search of a Soul',
  types: 'Psychological Types (CW 6)',
  two: 'Two Essays on Analytical Psychology (CW 7)',
  struct: 'The Structure and Dynamics of the Psyche (CW 8)',
};

export const jtexts: Record<string, JText> = {
  en: {
    ui: {
      ritual: 'Ritual · 40 s',
      stageWord: 'Stage',
      skip: 'Skip',
      close: 'Close',
      cont: 'Continue',
      chooseStep: 'Choose one small step for today. Only if it feels right.',
      noStep: 'Not now',
      next: 'To the next stage',
      consTitle: 'Your constellation',
      consSub: 'Every light is a step you chose. It is yours alone.',
      consEmpty: 'It will appear as you go. There is no right pace.',
      openRitual: 'Open',
      card: 'Save my card',
      remind: 'Remind me tomorrow for one minute',
      reminded: 'A calendar reminder for tomorrow was downloaded.',
      giveTitle: 'Give some good back',
      giveSub: 'What helped you can help someone else. Send a warm word or leave a light.',
      send: 'Send to someone',
      copied: 'Copied. Paste it wherever you talk to them.',
      light: 'Leave a light',
      lightDone: 'Your light is burning. It stays on this device for now.',
      tomorrow: 'My step for tomorrow',
      tomorrowNone: 'Tap a lit star to carry its step into tomorrow.',
      heart: 'Your heart',
      welcome: 'Your heart remembers you. Shall we continue?',
      quoteNote: 'C. G. Jung',
      mandalaPick: 'Choose a colour, then touch a petal.',
      stillBreak: 'That is fine. Begin again, gently.',
      hold: 'Keep your finger on the screen',
      steps: 'Tap, at your own pace',
      drag: 'Drag',
      trace: 'Trace the cracks with your finger',
      petalsLeft: 'petals left',
      cardTitle: 'Opus Magnum · my path',
      privacy: 'This stays on your device. Nothing is sent anywhere.',
    },
    rituals: [
      { title: 'Kintsugi', how: 'Trace the cracks with your finger. They will not vanish: they will become gold.', done: 'Gold has settled into the cracks.' },
      { title: 'Two currents', how: 'Slide the handle. The dark and the light do not fight: they meet.', done: 'Two currents became one ring.' },
      { title: 'Call the light', how: 'Keep your finger on the screen. Light comes to those who stay.', done: 'The light is here, and you called it.' },
      { title: 'Steps', how: 'Tap in your own rhythm. Every step counts.', done: 'You climbed higher than you thought.' },
      { title: 'Strength with shores', how: 'Carry the light into the vessel. Strength that has shores warms instead of burning.', done: 'The vessel is full, and it holds.' },
      { title: 'Do nothing', how: 'Be still for twelve seconds, touching nothing.', done: 'Stillness was already full of life.' },
      { title: 'Your handwriting', how: 'Pick a colour and paint the petals. This mandala is yours.', done: 'No one else has this mandala.' },
    ],
    steps: [
      ['Say to one person: “this is hard for me”', 'Step outside for ten minutes', 'Eat and drink something: care for the body'],
      ['Notice what makes me feel worse, and skip it today', 'Call someone beside whom I feel calmer', 'Remember one activity that brings me back to myself'],
      ['Name one trusted person I can talk to', 'Find a specialist or a support group', 'Ask one person for one specific kind of help'],
      ['Do one small thing I keep postponing', 'Walk or move for fifteen minutes', 'Go to bed an hour earlier tonight'],
      ['Say “no” to something that harms me', 'Ask a friend how they are', 'Choose the people and places that feel safe'],
      ['Five minutes of silence without a screen', 'Spend time with someone dear, with no agenda', 'Drink a cup of tea slowly, doing nothing else'],
      ['Take a first step toward my own work (a sketch, a lesson, a call)', 'Say thank you to someone who did not turn away', 'Picture what an ordinary good day would be'],
    ],
    quotes: [
      { q: 'There is no coming to consciousness without pain.', src: SRC.alch },
      { q: 'In all chaos there is a cosmos, in all disorder a secret order.', src: SRC.arch },
      { q: 'The meeting of two personalities is like the contact of two chemical substances: if there is any reaction, both are transformed.', src: SRC.modern },
      { q: 'The creation of something new is not accomplished by the intellect but by the play instinct acting from inner necessity.', src: SRC.types },
      { q: 'Where love rules, there is no will to power; and where power predominates, love is lacking. The one is the shadow of the other.', src: SRC.two },
      { q: 'Man needs difficulties; they are necessary for health.', src: SRC.struct },
      { q: 'The shoe that fits one person pinches another; there is no recipe for living that suits all cases.', src: SRC.modern },
    ],
    warm: [
      'I am thinking of you. No questions, just know that you matter to me.',
      'How are you? If you want to talk, I am here.',
      'Thank you for being in my life. Shall we have tea this week?',
    ],
  },
  ru: {
    ui: {
      ritual: 'Ритуал · 40 с',
      stageWord: 'Стадия',
      skip: 'Пропустить',
      close: 'Закрыть',
      cont: 'Продолжить',
      chooseStep: 'Выбери один маленький шаг на сегодня. Только если откликается.',
      noStep: 'Пока нет',
      next: 'К следующей стадии',
      consTitle: 'Твоё созвездие',
      consSub: 'Каждый огонёк — шаг, который выбрал ты. Оно только твоё.',
      consEmpty: 'Оно появится по ходу пути. Правильного темпа нет.',
      openRitual: 'Открыть',
      card: 'Сохранить мою карточку',
      remind: 'Напомнить завтра на одну минуту',
      reminded: 'Напоминание на завтра скачано в календарь.',
      giveTitle: 'Отдать добро',
      giveSub: 'То, что помогло тебе, может помочь другому. Отправь тёплое слово или оставь огонёк.',
      send: 'Отправить кому-то',
      copied: 'Скопировано. Вставь туда, где ты с этим человеком говоришь.',
      light: 'Оставить огонёк',
      lightDone: 'Твой огонёк горит. Пока он хранится только на этом устройстве.',
      tomorrow: 'Мой шаг на завтра',
      tomorrowNone: 'Коснись горящей звезды, чтобы взять её шаг в завтрашний день.',
      heart: 'Твоё сердце',
      welcome: 'Твоё сердце тебя помнит. Продолжим?',
      quoteNote: 'К. Г. Юнг',
      mandalaPick: 'Выбери цвет и коснись лепестка.',
      stillBreak: 'Ничего страшного. Начнём снова, мягко.',
      hold: 'Держи палец на экране',
      steps: 'Касайся в своём ритме',
      drag: 'Потяни',
      trace: 'Проведи пальцем по трещинам',
      petalsLeft: 'лепестков осталось',
      cardTitle: 'Opus Magnum · мой путь',
      privacy: 'Это остаётся на твоём устройстве. Ничего никуда не отправляется.',
    },
    rituals: [
      { title: 'Кинцуги', how: 'Проведи пальцем по трещинам. Они не исчезнут — они станут золотом.', done: 'Золото легло в трещины.' },
      { title: 'Два течения', how: 'Потяни ползунок. Тёмное и светлое не воюют — они встречаются.', done: 'Два течения стали одним кольцом.' },
      { title: 'Позови свет', how: 'Держи палец на экране. Свет приходит к тому, кто остаётся.', done: 'Свет здесь, и ты его позвал(а).' },
      { title: 'Шаги', how: 'Касайся экрана в своём ритме. Каждый шаг считается.', done: 'Ты поднялся(ась) выше, чем думал(а).' },
      { title: 'Сила с берегами', how: 'Перенеси свет в сосуд. Сила, у которой есть берега, согревает, а не жжёт.', done: 'Сосуд полон, и он держит.' },
      { title: 'Ничего не делай', how: 'Побудь в тишине двенадцать секунд, ни к чему не прикасаясь.', done: 'В тишине уже была жизнь.' },
      { title: 'Твой почерк', how: 'Выбери цвет и раскрась лепестки. Эта мандала — твоя.', done: 'Такой мандалы больше нет ни у кого.' },
    ],
    steps: [
      ['Сказать одному человеку: «мне сейчас тяжело»', 'Выйти на десять минут на воздух', 'Поесть и попить: позаботиться о теле'],
      ['Заметить, после чего мне хуже, и сегодня обойтись без этого', 'Позвонить тому, рядом с кем мне спокойнее', 'Вспомнить занятие, которое возвращает меня к себе'],
      ['Назвать одного человека, которому я доверяю', 'Найти специалиста или группу поддержки', 'Попросить одного человека об одной конкретной помощи'],
      ['Сделать одно маленькое дело, которое я откладываю', 'Погулять или подвигаться пятнадцать минут', 'Лечь сегодня на час раньше'],
      ['Сказать «нет» тому, что мне вредит', 'Спросить друга, как у него дела', 'Выбрать людей и места, рядом с которыми мне безопасно'],
      ['Пять минут тишины без экрана', 'Побыть рядом с дорогим человеком, без дел', 'Медленно выпить чашку чая, ничего больше не делая'],
      ['Сделать первый шаг к своему делу (набросок, урок, звонок)', 'Сказать «спасибо» тому, кто не отвернулся', 'Представить, каким будет мой обычный хороший день'],
    ],
    quotes: [
      { q: 'Нет пробуждения сознания без боли.', src: SRC.alch },
      { q: 'В любом хаосе есть космос, в любом беспорядке — тайный порядок.', src: SRC.arch },
      { q: 'Встреча двух личностей подобна соприкосновению двух химических веществ: если есть реакция, преображаются оба.', src: SRC.modern },
      { q: 'Новое создаётся не интеллектом, а инстинктом игры, действующим по внутренней необходимости.', src: SRC.types },
      { q: 'Где правит любовь, там нет воли к власти; где господствует власть, там нет любви. Одно — тень другого.', src: SRC.two },
      { q: 'Человеку нужны трудности; они необходимы для здоровья.', src: SRC.struct },
      { q: 'Башмак, который впору одному, жмёт другому; нет рецепта жизни, подходящего всем.', src: SRC.modern },
    ],
    warm: [
      'Я о тебе думаю. Без вопросов — просто знай, что ты мне важен(на).',
      'Как ты? Если захочешь поговорить — я рядом.',
      'Спасибо, что ты есть в моей жизни. Давай на этой неделе выпьем чаю?',
    ],
  },
};

export const jfor = (code: string): JText => jtexts[code] ?? jtexts.en;
