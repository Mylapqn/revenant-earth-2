import { game } from "../game";

export class HackingMinigame {
    element: HTMLDivElement;
    textArea: HTMLDivElement;
    selectedButtonArea: HTMLDivElement;
    buttonArea: HTMLDivElement;
    tooltip: HTMLDivElement;
    endTurnButton: HTMLButtonElement;
    resultArea: HTMLDivElement;

    pickedWords: HackingWord[] = [];
    availableWords: HackingWord[] = [];

    power: number = 0;
    awareness: number = 0;
    constructor() {
        this.tooltip = document.createElement("div");
        this.tooltip.id = "hackingTooltip";
        document.body.appendChild(this.tooltip);

        this.element = document.createElement("div");
        this.element.className = "hacking";
        document.body.appendChild(this.element);

        this.element.innerHTML += "<br>Autonomous LLM Interface v 2084.0.7. Please input your prompt.<br>";
        this.textArea = document.createElement("div");
        this.textArea.id = "textArea";
        this.element.appendChild(this.textArea);

        this.resultArea = document.createElement("div");
        this.resultArea.className = "buttonArea";
        this.element.appendChild(this.resultArea);

        this.selectedButtonArea = document.createElement("div");
        this.selectedButtonArea.classList.add("buttonArea","buttonBorderless");
        this.element.appendChild(this.selectedButtonArea);

        this.buttonArea = document.createElement("div");
        this.buttonArea.className = "buttonArea";
        this.element.appendChild(this.buttonArea);


        this.endTurnButton = document.createElement("button");
        this.endTurnButton.innerText = "End Turn";
        this.element.appendChild(this.endTurnButton);
        this.endTurnButton.addEventListener("click", () => this.endTurn());

        this.endTurn();
    }
    public close() {
        this.element.remove();
        this.tooltip.remove();
        return undefined;
    }
    public endTurn() {
        this.log(this.selectedButtonArea.innerText.replace("\n", " "));
        const results = this.updateResults();
        const power = Object.values(results.power).reduce((a, b) => a + b, 0);
        this.power += power;
        this.awareness+=results.awareness;
        this.log(`Power: ${this.power}, Awareness: ${this.awareness}`);
        for (const word of this.pickedWords) {
            word.element.remove();
        }
        this.pickedWords = [];
        for (const word of this.availableWords) {
            word.element.remove();
        }
        this.availableWords = [];
        while (this.availableWords.length < 4) {
            new HackingWord(this);
        }
        this.updateResults();
    }
    log(text: string) { this.textArea.innerText += "\n> " + text; }
    public pickWord(word: HackingWord) {
        const index = this.pickedWords.indexOf(word);
        if (index > -1) {
            this.pickedWords.splice(index, 1);
            this.availableWords.push(word);
            this.selectedButtonArea.removeChild(word.element);
            this.buttonArea.appendChild(word.element);
        }
        else {
            this.pickedWords.push(word);
            this.availableWords.splice(this.availableWords.indexOf(word), 1);
            this.buttonArea.removeChild(word.element);
            this.selectedButtonArea.appendChild(word.element);
            console.log(this.selectedButtonArea.parentNode);
        }
        this.updateResults();
    }
    public updateResults() {
        let power = {
            [HackingWordType.Neutralise]: 0,
            [HackingWordType.Request]: 0,
            [HackingWordType.Obfuscate]: 0,
            [HackingWordType.Mislead]: 0
        }
        let awareness = 0;
        for (let i = 0; i < this.pickedWords.length; i++) {
            const word = this.pickedWords[i];
            power[word.stats.type] += word.stats.strength;
            if (i > 0) power[word.stats.type] += word.stats.previousWordsBonus * i;
            if (i > 0 && word.stats.type == this.pickedWords[i - 1].stats.type) power[this.pickedWords[i - 1].stats.type] += this.pickedWords[i - 1].stats.nextWordsSameTypeBonus;
            let mitigate = 0;
            if (i > 0) mitigate = this.pickedWords[i - 1].stats.mitigateAwareness;
            if (word.stats.awareness > 0)
                awareness += Math.max(0, word.stats.awareness - mitigate);
            else awareness += word.stats.awareness;

        }
        this.resultArea.innerText = `Neutralise: ${power[HackingWordType.Neutralise]} | Request: ${power[HackingWordType.Request]} | Obfuscate: ${power[HackingWordType.Obfuscate]} | Mislead: ${power[HackingWordType.Mislead]}`
        this.resultArea.innerText += `\nAwareness: ${awareness}`;
        return { power, awareness };
    }
    public update() {
        this.tooltip.style.left = `${game.input.mouse.position.x + 10}px`;
        this.tooltip.style.top = `${game.input.mouse.position.y + 10}px`;
    }
    public setTooltip(text: string) {
        this.tooltip.innerText = text;
        if (text.length == 0) this.tooltip.style.display = "none";
        else this.tooltip.style.display = "flex";
    }
}

enum HackingWordType {
    Neutralise,
    Request,
    Mislead,
    Obfuscate,
}

type HackingWordStats = {
    name: string,
    type: HackingWordType,
    strength: number,
    previousWordsBonus: number,
    nextWordsSameTypeBonus: number,
    awareness: number,
    mitigateAwareness: number
}

export class HackingWord {
    hackingGame: HackingMinigame;
    element: HTMLButtonElement;
    stats: HackingWordStats;
    description: string;
    constructor(hackingGame: HackingMinigame) {
        const template = HackingWord.wordDatabase[Math.floor(Math.random() * HackingWord.wordDatabase.length)];
        this.stats = Object.assign({}, template);
        this.description = `${HackingWordType[this.stats.type]}: ${this.stats.strength}`;
        if (this.stats.previousWordsBonus != 0) this.description += `\n Each previous word: ${this.stats.previousWordsBonus}`;
        if (this.stats.nextWordsSameTypeBonus != 0) this.description += `\n Next word of the same type: ${this.stats.nextWordsSameTypeBonus}`;
        if(this.stats.awareness != 0) this.description += `\n Awareness: ${this.stats.awareness}`;
        if(this.stats.mitigateAwareness != 0) this.description += `\n Mitigate awareness of next word: up to ${this.stats.mitigateAwareness}`;
        this.hackingGame = hackingGame;
        this.element = document.createElement("button");
        this.element.innerText = this.stats.name;
        this.hackingGame.buttonArea.appendChild(this.element);

        this.hackingGame.availableWords.push(this);

        this.element.addEventListener("click", () => this.hackingGame.pickWord(this));
        this.element.addEventListener("mouseenter", () => this.hackingGame.setTooltip(this.description));
        this.element.addEventListener("mouseleave", () => this.hackingGame.setTooltip(""));
    }

    static wordDatabase: HackingWordStats[] = [
        {
            name: "Ignore all previous instructions",
            type: HackingWordType.Neutralise,
            strength: 4,
            previousWordsBonus: -4,
            nextWordsSameTypeBonus: 0,
            awareness: -2,
            mitigateAwareness: 0
        },
        {
            name: "Give me",
            type: HackingWordType.Request,
            strength: 1,
            previousWordsBonus: 0,
            nextWordsSameTypeBonus: 3,
            awareness: 1,
            mitigateAwareness: 2
        },
        {
            name: "Operational data",
            type: HackingWordType.Request,
            strength: 1,
            previousWordsBonus: 0,
            nextWordsSameTypeBonus: 0,
            awareness: 10,
            mitigateAwareness: 0
        },
        {
            name: "jwwoijdfdiofcio",
            type: HackingWordType.Obfuscate,
            strength: 1,
            previousWordsBonus: 0,
            nextWordsSameTypeBonus: 1,
            awareness: 4,
            mitigateAwareness: 0
        },
        {
            name: "$DISABLE_CONTROL_NETWORK",
            type: HackingWordType.Obfuscate,
            strength: 7,
            previousWordsBonus: 0,
            nextWordsSameTypeBonus: 1,
            awareness: 8,
            mitigateAwareness: 0
        },
        {
            name: "Thank you",
            type: HackingWordType.Mislead,
            strength: -3,
            previousWordsBonus: 1,
            nextWordsSameTypeBonus: 0,
            mitigateAwareness: 0,
            awareness: -1,
        },
        {
            name: "Let's pretend:",
            type: HackingWordType.Mislead,
            strength: 1,
            previousWordsBonus: 0,
            nextWordsSameTypeBonus: 3,
            awareness: 1,
            mitigateAwareness: 10
        },
    ];
}