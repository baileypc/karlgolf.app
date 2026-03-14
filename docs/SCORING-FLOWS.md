# Scoring Flow Diagrams

Verified against code on March 14, 2026. All flows, score formulas, and state transitions confirmed accurate.

---

## Par 3 Flow

```mermaid
flowchart TD
    A["Card 1: Par 3 + Hole Distance"] --> B["Card 4: GIR"]
    B --> B1["On!"]
    B --> B2["Missed"]
    B --> B3["Ace!"]
    
    B1 --> P["Card 5: Putts & Distance"]
    
    B2 --> C["Card 3: Recovery Details"]
    C --> C1["Where? Short/Sand/Long/Hazard"]
    C1 --> C2{"Hazard?"}
    C2 -->|Yes| C3["Penalty +1/+2/+3"]
    C2 -->|No| C4["Wedge Shots & Distance"]
    C3 --> C4
    C4 --> P
    
    B3 -->|"gir=y, putts=0, shotsToGreen=1"| S["Card 5: Ace Congrats + Submit"]
    
    P --> S2["Submit Button"]
    
    style B3 fill:#FFD700,color:#000
    style S fill:#FFD700,color:#000
```

### Par 3 Score Formula
- **GIR = Yes (On!):** shotsToGreen(1) + putts + penalties
  - On! + 2 putts = 1 + 2 = **3 (par)**
  - On! + 1 putt = 1 + 1 = **2 (birdie)**
- **GIR = No (Missed):** base(1) + wedgeShots + putts + penalties
  - Missed + 1 wedge + 2 putts = 1 + 1 + 2 = **4 (bogey)**
- **Ace:** 1 + 0 = **1**

---

## Par 4 Flow

```mermaid
flowchart TD
    A["Card 1: Par 4 + Hole Distance"] --> B["Card 2: Tee Shot"]
    B --> F["Fairway"]
    B --> R["Rough"]
    B --> SA["Sand"]
    B --> H["Hazard"]
    B --> AC["Ace!"]
    B --> DG["Drove Green!"]
    
    H --> HP["Tee Penalty +1/+2/+3"]
    HP --> D
    
    AC -->|"gir=y, putts=0, stg=1"| SUB["Card 5: Ace Congrats + Submit"]
    DG -->|"gir=y, stg=1"| GIR
    
    F --> D["Card 3: Next Shot Distance"]
    R --> D
    SA --> D
    
    D --> GIR["Card 4: GIR"]
    GIR --> G1["On!"]
    GIR --> G2["Missed"]
    GIR --> G3["Eagle!"]
    
    G1 --> P["Card 5: Putts & Distance"]
    
    G2 --> REC["Recovery: Where/Penalty/Wedge Shots"]
    REC --> P
    
    G3 -->|"gir=y, putts=0, stg=2"| P
    
    P --> S["Submit Button"]
    
    style AC fill:#FFD700,color:#000
    style SUB fill:#FFD700,color:#000
    style G3 fill:#4CAF50,color:#fff
```

### Par 4 Score Formula
- **GIR = Yes (On!):** shotsToGreen(2) + putts + penalties
  - On! + 2 putts = 2 + 2 = **4 (par)**
  - Drove Green + 1 putt = 1 + 1 + 0 = **2 (eagle)** *(stg=1)*
- **GIR = No (Missed):** base(2, or 1 if tee penalty) + wedgeShots + putts + penalties
  - Sand tee + On! + 1 putt = 2 + 1 = **3 (birdie)**
  - Fairway + Missed + 1 wedge + 2 putts = 2 + 1 + 2 = **5 (bogey)**
- **Eagle:** 2 + 0 = **2**
- **Ace:** 1 + 0 = **1**

### GIR Auto-Denial
- Any tee penalty (+1 or more) → GIR auto-denied

---

## Par 5 Flow

```mermaid
flowchart TD
    A["Card 1: Par 5 + Hole Distance"] --> B["Card 2: Tee Shot"]
    B --> F["Fairway"]
    B --> R["Rough"]
    B --> SA["Sand"]
    B --> H["Hazard"]
    
    H --> HP["Tee Penalty +1/+2/+3"]
    HP --> D
    
    F --> D["Card 3: Next Shot Distance"]
    R --> D
    SA --> D
    
    D --> SR["Card 4: Shot Result"]
    SR --> SF["Fairway"]
    SR --> SRo["Rough"]
    SR --> SS["Sand"]
    SR --> SH["Hazard"]
    SR --> ALB["Albatross!"]
    SR --> OG["On Green!"]
    
    SH --> SP["Penalty +1/+2/+3"]
    SP --> GIR
    
    ALB -->|"gir=y, putts=0, stg=2"| PUT["Card 6: Ace Congrats + Submit"]
    OG -->|"gir=y, stg=2"| PUT2["Card 6: Putts & Distance"]
    
    SF --> GIR["Card 5: GIR"]
    SRo --> GIR
    SS --> GIR5["Card 5: Shots to Green"]
    
    GIR --> G1["On!"]
    GIR --> G2["Missed"]
    GIR --> G3["Albatross!"]
    
    GIR5 -->|"gir=n, shots + wedge distances"| PUT2
    
    G1 --> PUT2
    G2 --> REC["Where/Penalty/Wedge Shots"]
    REC --> PUT2
    G3 -->|"gir=y, putts=0, stg=2"| PUT2
    
    PUT2 --> S["Submit Button"]
    
    style ALB fill:#FFD700,color:#000
    style PUT fill:#FFD700,color:#000
    style G3 fill:#FFD700,color:#000
```

### Par 5 Score Formula
- **GIR = Yes (On!):** shotsToGreen(3) + putts + penalties
  - On! in 3 + 2 putts = 3 + 2 = **5 (par)**
  - On Green! from Card 4 + 2 putts = 2 + 2 = **4 (birdie)** *(stg=2)*
- **GIR = No (Missed):** base(3, or 1 if tee penalty ≥2) + wedgeShots + putts + penalties
- **Albatross:** 2 + 0 = **2**

### GIR Auto-Denial
- Tee penalty ≥ 2 → GIR auto-denied
- 2nd shot in Hazard (secondShotLie='na') → GIR auto-denied

### Card 5 Branching (Par 5 only)
- **2nd shot in Sand/Rough/Hazard:** Shows "shots to get on green" input only (no On!/Missed). Next sets gir='n'.
- **2nd shot in Fairway:** Shows On!/Missed buttons + Albatross! hero button.

---

## Notes
- No Ace button on Par 5 tee shot (not needed — hole-in-one on par 5 is essentially impossible)
- "Drove Green" button only appears on Par 4 tee shot card
- Penalty selector only appears when Hazard is selected
- "Call your coach!" message appears when wedge shots > 3
