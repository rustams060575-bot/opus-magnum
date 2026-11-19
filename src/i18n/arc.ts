/** Strings for the "first thought → mandala" arc: the optional first line, reading it again, three symbol cards. */
export interface Arc {
  firstPh: string;
  readStart: string;
  eyebrow: string;
  noticeQ: string;
  replyPh: string;
  about: { mirror: string; mountain: string; mandala: string };
  cards: { mirror: string[]; mountain: string[]; mandala: string[] };
}

export const ARC: Record<string, Arc> = {
  ru: {
    firstPh: 'Если хочется, оставьте одну мысль, с которой вы пришли',
    readStart: 'Прочитать себя в начале',
    eyebrow: 'Ваши слова в начале пути',
    noticeQ: 'Что вы замечаете в этих словах теперь?',
    replyPh: 'Можно ответить — или просто закрыть',
    about: { mirror: 'О зеркале', mountain: 'О горе', mandala: 'О мандале' },
    cards: {
      mirror: ['Зеркало раскололось, но не исчезло: в каждом осколке остаётся ваше лицо.', 'Здесь встречаются две стороны, которые не хотят уживаться. Не нужно выбирать между ними — достаточно сперва увидеть обе.'],
      mountain: ['Гора не торопит и не судит: она просто стоит перед вами.', 'Это испытание собственной силой — подъём, в котором узнаёшь, на что способен и где нужна пауза.'],
      mandala: ['Круг собирает вместе то, что раньше жило порознь: тьму и свет, потерю и надежду.', 'Взгляните на путь целиком — и заметьте, какие его части теперь стоят рядом.'],
    },
  },
  en: {
    firstPh: 'If you wish, leave one thought you came with',
    readStart: 'Read myself at the start',
    eyebrow: 'Your words at the start of the path',
    noticeQ: 'What do you notice in these words now?',
    replyPh: 'You may answer — or simply close',
    about: { mirror: 'About the mirror', mountain: 'About the mountain', mandala: 'About the mandala' },
    cards: {
      mirror: ['The mirror has broken, but it has not vanished: your face remains in every shard.', 'Two sides that refuse to live together meet here. You do not have to choose between them — first, it is enough to see both.'],
      mountain: ['The mountain neither hurries nor judges you: it simply stands before you.', 'It is a trial of your own strength — a climb in which you learn what you can do, and where you need to pause.'],
      mandala: ['The circle gathers what once lived apart: darkness and light, loss and hope.', 'Look at the path as a whole — and notice which of its parts now stand side by side.'],
    },
  },
  es: {
    firstPh: 'Si quieres, deja un pensamiento con el que llegaste',
    readStart: 'Leerme al principio',
    eyebrow: 'Tus palabras al comienzo del camino',
    noticeQ: '¿Qué notas ahora en estas palabras?',
    replyPh: 'Puedes responder, o simplemente cerrar',
    about: { mirror: 'Sobre el espejo', mountain: 'Sobre la montaña', mandala: 'Sobre el mandala' },
    cards: {
      mirror: ['El espejo se rompió, pero no desapareció: tu rostro sigue en cada fragmento.', 'Aquí se encuentran dos lados que no quieren convivir. No hace falta elegir entre ellos: primero basta con ver los dos.'],
      mountain: ['La montaña ni apremia ni juzga: simplemente está frente a ti.', 'Es la prueba de tu propia fuerza: una subida en la que descubres de qué eres capaz y dónde necesitas una pausa.'],
      mandala: ['El círculo reúne lo que antes vivía separado: oscuridad y luz, pérdida y esperanza.', 'Mira el camino entero y observa qué partes suyas están ahora una junto a otra.'],
    },
  },
  uk: {
    firstPh: 'Якщо хочеться, залиште одну думку, з якою ви прийшли',
    readStart: 'Прочитати себе на початку',
    eyebrow: 'Ваші слова на початку шляху',
    noticeQ: 'Що ви помічаєте в цих словах тепер?',
    replyPh: 'Можна відповісти — або просто закрити',
    about: { mirror: 'Про дзеркало', mountain: 'Про гору', mandala: 'Про мандалу' },
    cards: {
      mirror: ['Дзеркало розкололося, але не зникло: у кожному уламку лишається ваше обличчя.', 'Тут зустрічаються два боки, які не хочуть уживатися. Не треба обирати між ними — спершу досить побачити обидва.'],
      mountain: ['Гора не квапить і не судить: вона просто стоїть перед вами.', 'Це випробування власною силою — підйом, у якому дізнаєшся, на що здатен і де потрібна пауза.'],
      mandala: ['Коло збирає разом те, що жило окремо: темряву й світло, втрату й надію.', 'Погляньте на шлях цілком — і зауважте, які його частини тепер стоять поруч.'],
    },
  },
  fr: {
    firstPh: 'Si vous le souhaitez, laissez une pensée avec laquelle vous êtes venu',
    readStart: 'Me relire au début',
    eyebrow: 'Vos mots au début du chemin',
    noticeQ: 'Que remarquez-vous dans ces mots maintenant ?',
    replyPh: 'Vous pouvez répondre — ou simplement fermer',
    about: { mirror: 'À propos du miroir', mountain: 'À propos de la montagne', mandala: 'À propos du mandala' },
    cards: {
      mirror: ['Le miroir s’est brisé, mais n’a pas disparu : votre visage demeure dans chaque éclat.', 'Deux côtés qui ne veulent pas cohabiter se rencontrent ici. Inutile de choisir : il suffit d’abord de voir les deux.'],
      mountain: ['La montagne ne presse pas et ne juge pas : elle se tient simplement devant vous.', 'C’est l’épreuve de votre propre force — une ascension où l’on découvre ce dont on est capable et où l’on a besoin d’une pause.'],
      mandala: ['Le cercle rassemble ce qui vivait séparé : l’ombre et la lumière, la perte et l’espoir.', 'Regardez le chemin dans son ensemble — et remarquez quelles parties se tiennent désormais côte à côte.'],
    },
  },
  de: {
    firstPh: 'Wenn du magst, lass einen Gedanken da, mit dem du gekommen bist',
    readStart: 'Mich am Anfang lesen',
    eyebrow: 'Deine Worte am Anfang des Weges',
    noticeQ: 'Was fällt dir jetzt an diesen Worten auf?',
    replyPh: 'Du kannst antworten — oder einfach schließen',
    about: { mirror: 'Über den Spiegel', mountain: 'Über den Berg', mandala: 'Über das Mandala' },
    cards: {
      mirror: ['Der Spiegel ist zerbrochen, aber nicht verschwunden: In jeder Scherbe bleibt dein Gesicht.', 'Hier begegnen sich zwei Seiten, die nicht zusammenleben wollen. Du musst dich nicht entscheiden — zuerst genügt es, beide zu sehen.'],
      mountain: ['Der Berg drängt nicht und urteilt nicht: Er steht einfach vor dir.', 'Es ist die Prüfung der eigenen Kraft — ein Aufstieg, auf dem du erfährst, was du kannst und wo du eine Pause brauchst.'],
      mandala: ['Der Kreis versammelt, was einst getrennt lebte: Dunkel und Licht, Verlust und Hoffnung.', 'Sieh den Weg als Ganzes — und bemerke, welche seiner Teile nun nebeneinander stehen.'],
    },
  },
  pt: {
    firstPh: 'Se quiser, deixe um pensamento com o qual você chegou',
    readStart: 'Ler-me no início',
    eyebrow: 'Suas palavras no início do caminho',
    noticeQ: 'O que você percebe nestas palavras agora?',
    replyPh: 'Você pode responder — ou simplesmente fechar',
    about: { mirror: 'Sobre o espelho', mountain: 'Sobre a montanha', mandala: 'Sobre o mandala' },
    cards: {
      mirror: ['O espelho se partiu, mas não desapareceu: o seu rosto permanece em cada fragmento.', 'Aqui se encontram dois lados que não querem conviver. Não é preciso escolher entre eles: primeiro basta ver os dois.'],
      mountain: ['A montanha não apressa nem julga: ela simplesmente está diante de você.', 'É a prova da sua própria força — uma subida em que você descobre do que é capaz e onde precisa de uma pausa.'],
      mandala: ['O círculo reúne o que antes vivia separado: escuridão e luz, perda e esperança.', 'Olhe o caminho inteiro — e perceba quais partes dele agora estão lado a lado.'],
    },
  },
};
export const arcFor = (lang: string): Arc => ARC[lang] ?? ARC.en;
