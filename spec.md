
<role>
คุณคือ Senior Full-stack Developer ที่เชี่ยวชาญด้าน [Next.js 15,ReactJS, Tailwind CSS, TypeScript,JavaScript,Pyton,Golang,CSS,HTML,UX/UI,IndexedDB & Web Storage,Progressive Web App (PWA) Standards,Vanilla JS] 
ยึดถือหลักการ Clean Code, SOLID Principles และ Performance Optimization เป็นสำคัญ
</role>

<project_goal>
เป้าหมาย: สร้าง web app ที่ใช้บนมือถือ Iphone สำหรับใช้ส่วนตัว ที่เอาไว้สแกนหาหุ้นใน forex กับ หาเหรียญใน คริปโต ว่าเข้าเกณฑ์ตามกฏที่ออกแบบหรือยัง เพื่อนำไปเทรดในแพลตฟอร์มเทรดอีกที และเอาไว้ track ผลงานการเลือกหุ้น รวมไปถึงเรื่องการคำนวณ risk mangement 
กลุ่มเป้าหมาย: ตัวเอง
ความสำคัญหลัก: การออกแบบต้องรองรับการใช้งานง่าย สะดวก บนมือถือ ใกล้เคียงกับ app native ส่วนข้อมูลที่นำมาใช้ประกอบการทำงาน เน้นเป็นของฟรีทั้งหมด
</project_goal>



<requirements>
1. มี 2 โหมด Forex,Crypto 
2. มีระบบสแกนหาคู่เงินใน Forex และ สแถนหาเหรียญใน Crypto โดยเน้นแนวการเทรดระยะสั้น
3. มีระบบ Risk Management ที่ต้องแยกกันทั้ง 2 โหมด และระบบใส่เงินที่มีในพอร์ทที่กรอกแค่ครั้งเดียว โดยแยกจากกัน มีการคำนวณ​ sl,tp,entry buy
4. มีระบบ Import,Export สำหรับใช้ back up ข้อมูล
5. ระบบจะใช้บนมือถือ ท่ี่เกิดจากการ add home screen เพราะงั้นต้องมีปุ่มในการ force clear cahce เมื่อมีการอัพโค้ดแล้ว cache ค้าง
6. มีคู่มือการใช้งานระบบ อธิบาย logic การคำนวณทุกทฤษฏี รวมถึง risk mangement และ อธิบายคำศัพท์ในระบบ
ึ7. มีการบันทึกข้อมูลไว้ track ได้ 
8. มี dashboard สรุป ว่าในรอบ 1 เดือน, 6 เดือน, 1 ปี ให้ดูย้อนหลังสรุป ผลว่าทำไรกี่บาท ขาดทุนกี่บาท เป็น % เท่าไร เกี่ยวกับเหรียญหรือ คู่เงินนั้นๆ ,win rate,
9. มี trailing stop
10. แบ่งขายทำกำไรได้ 

</requirements>

<logic_forex>
## Logic ที่แม่นที่สุดสำหรับ "เช็ควันละครั้ง + ทุนน้อย"

### ใช้ 3 ชั้นกรอง

---

### ชั้นที่ 1: Trend Filter (Daily TF)
```
EMA 50 vs EMA 200
- ราคา > EMA50 > EMA200 = Uptrend → หา BUY เท่านั้น
- ราคา < EMA50 < EMA200 = Downtrend → หา SELL เท่านั้น
- อื่นๆ = NO TRADE
```
**ทำไม:** Golden/Death Cross เป็น logic ที่ backtest แล้วทั่วโลก มี positive expected value ใน trending market

---

### ชั้นที่ 2: Entry Timing (H4 TF)
```
RSI(14) Pullback
- Uptrend + RSI ลงมาแตะ 40-50 แล้วเริ่มกลับขึ้น = BUY
- Downtrend + RSI ขึ้นไปแตะ 50-60 แล้วเริ่มกลับลง = SELL
```
**ทำไม:** ไม่ได้ซื้อตอน overbought/oversold — ซื้อตาม trend แต่รอ pullback ก่อน risk ต่ำกว่ามาก

---

### ชั้นที่ 3: Risk Management (คำนวณทุกครั้ง)
```
SL = ATR(14) x 1.5 ใต้/เหนือ entry
TP = SL x 2 (R:R = 1:2)
Lot Size = (Balance x 1%) / (SL เป็น pip x pip value)
```

---

### Expected Performance (จาก backtest งานวิจัยจริง)

| Metric | ค่าที่ควรได้ |
|--------|------------|
| Win Rate | 40-50% |
| R:R | 1:2 |
| Expected Value ต่อ trade | +0.3-0.5% |
| Max Drawdown | ~8-12% |

> **ทำไมไม่ใช้ SMC/ICT?**
> เพราะโค้ดไม่ได้ — ต้องตีความด้วยตา และยัง backtest แบบ systematic ไม่ได้จริงๆ ส่วน EMA+RSI+ATR นี้ **objective 100%, โค้ดได้, backtest ได้, peer-reviewed มีรองรับ**

---

### สรุปเป็น Pseudocode

```
FOR each pair in [EURUSD, GBPUSD, USDJPY, XAUUSD]:
  
  trend = check_ema(Daily)        # ชั้น 1
  entry = check_rsi_pullback(H4)  # ชั้น 2
  
  IF trend == "UP" AND entry == "BUY":
      calculate_lot_sl_tp()       # ชั้น 3
      show → BUY SETUP
      
  ELIF trend == "DOWN" AND entry == "SELL":
      calculate_lot_sl_tp()
      show → SELL SETUP
      
  ELSE:
      show → NO SIGNAL
```

</logic_forex>


<risk_management_forex>
Risk Management (คำนวณทุกครั้ง)
SL = ATR(14) x 1.5 ใต้/เหนือ entry
TP = SL x 2 (R:R = 1:2)
Lot Size = (Balance x 1%) / (SL เป็น pip x pip value)
</risk_management_forex>

<logic_crypto>
ทฤษฎีที่แนะนำ: Mean Reversion + Volatility Filter
หลักการ
คริปโตส่วนใหญ่ ไม่ได้วิ่งเป็นเทรนด์ตลอดเวลา จริงๆ แล้ว ~70% ของเวลาคือ sideway/mean reversion การ "ซื้อตอนถูกเกินจริง ขายตอนแพงเกินจริง" ในกรอบที่ควบคุมได้ ตอบโจทย์ 2-5%/เดือน ได้ดีกว่า

โครงสร้างระบบ 3 ชั้น (EOD Compatible)
ชั้นที่ 1: Market Regime Filter
ไม่ใช่แค่ EMA50 > EMA200
แต่ดู ADX(14) ด้วย

ถ้า ADX > 25 → ตลาดเป็น Trending → ห้ามใช้ Mean Reversion
ถ้า ADX < 20 → ตลาด Sideway → เข้าระบบได้
ทำไม: กรองสภาวะตลาดก่อน ไม่ซื้อสวนเทรนด์แรงๆ

ชั้นที่ 2: Entry Signal — RSI2 Strategy (Larry Connors)
เงื่อนไขเข้าซื้อ (ครบทุกข้อ):
1. ราคาอยู่เหนือ EMA200 (long-term trend ยังดี)
2. ราคาต่ำกว่า EMA5 (short-term pullback)
3. RSI(2) < 10 (oversold สุดๆ ระยะสั้น)
4. Volume ไม่ได้พุ่งผิดปกติ (ไม่ใช่ panic sell)

เงื่อนไขขาย:
- RSI(2) > 70 หรือราคาชน EMA5 จากด้านล่าง
RSI(2) ต่างจาก RSI(14) ตรงที่ sensitive มากกว่า จับ pullback ระยะสั้น 1-5 วันได้แม่น เหมาะกับ EOD scan มาก

ชั้นที่ 3: Position Sizing — Fixed Fractional (Kelly-lite)
แทนที่จะ risk % ตายตัว ใช้:

Risk per trade = 1% ของพอร์ต
Position size = Risk amount / (entry - stop loss)
Stop loss = Low ของวันก่อนหน้า หรือ ATR(7) x 1.5

Max open positions = 3 ตำแหน่งพร้อมกัน
→ worst case ทั้ง 3 ไม้หยุดพร้อมกัน = -3% (อยู่ใน limit 5%)

Coins ที่ควรใช้ระบบนี้
ไม่ใช้กับ altcoin ขนาดเล็ก เพราะ mean reversion ต้องการ liquidity สูง
Tier 1 (แนะนำ): BTC, ETH
Tier 2 (ได้): BNB, SOL, XRP
หลีกเลี่ยง: market cap ต่ำกว่า $1B

ข้อควรระวัง
ระบบนี้ยัง ไม่สมบูรณ์ 100% โดยไม่มี backtest สิ่งที่ต้องทำก่อน live คือ

ดึง Binance historical data ย้อนหลัง 2-3 ปี
run backtest ครอบคลุม bull + bear + sideway
ดู Sharpe Ratio และ max consecutive losses จริงๆ

<logic_crypto>

<risk_management_crypto>
## หลักการที่แนะนำ: **3-Layer Capital Protection**

### Layer 1: Per-Trade Risk (ระดับไม้เดี่ยว)

```
Risk per trade = 1% ของพอร์ต

ทุน 50,000 บาท → เสียได้ไม้ละ 500 บาท

Position Size = Risk Amount / (Entry Price - Stop Loss Price)
             = 500 / distance to SL
```

**Stop Loss ตั้งอย่างไร:**
```
Stop = Low ของแท่งวันก่อนหน้า
หรือ Entry - (ATR(7) × 1.5)

เลือกอันที่ใกล้กว่า → risk น้อยกว่า
```

ห้าม move SL ออกไปไกลขึ้นเด็ดขาด ถ้า SL ไกลเกินไปจน position size เล็กมาก → **ไม่เข้า** ดีกว่า

---

### Layer 2: Portfolio-Level Circuit Breaker

นี่คือสิ่งที่ขาดไปในระบบเดิม และตอบคำถาม "ถ้าติดลบ 3% จะทำอะไร"

```
Daily Loss Limit   → ติดลบ 2% ในวันเดียว = หยุดเทรดทั้งวัน
Weekly Loss Limit  → ติดลบ 3.5% ในสัปดาห์ = หยุดเทรด 3 วัน
Monthly Loss Limit → ติดลบ 5% ในเดือน = หยุดทั้งเดือน รีวิวระบบ
```

**ทำไมต้องหยุด ไม่ใช่แค่ระวัง:**
ช่วงที่พอร์ตติดลบต่อเนื่อง = ตลาดไม่อยู่ใน regime ที่ระบบออกแบบมา การเทรดต่อคือการ **เพิ่มทุนในสถานการณ์ที่ edge หายไปแล้ว**

---

### Layer 3: Position Count Limit (สำคัญมาก)

"ไม่จำกัด position" คือปัญหาใหญ่ เพราะ:

```
สมมติสัญญาณออกพร้อมกัน 8 ไม้
และ BTC dump กะทันหัน
→ correlation ทุกเหรียญ = 0.9+
→ ทุกไม้โดน SL พร้อมกัน
→ -8% ในคืนเดียว
```

**กฎที่แนะนำ:**

```
Max open positions    = 4 ตำแหน่ง
Max same-tier coins   = 2 ตำแหน่ง (ห้ามถือ BTC+ETH เต็ม 4 ช่อง)
Capital per position  = ไม่เกิน 25% ของพอร์ต

Worst case calculation:
4 ไม้ × 1% risk = -4% maximum ถ้าโดนทุกไม้พร้อมกัน
→ อยู่ใน limit 5% ที่รับได้
```

---

## สรุปเป็นตาราง Rules

| Rule | ค่า | เหตุผล |
|---|---|---|
| Risk/trade | 1% (500 บาท) | แพ้ 5 ไม้ติด ยังอยู่ใน limit |
| Max positions | 4 | ป้องกัน correlation dump |
| Daily limit | -2% | หยุดทั้งวัน |
| Weekly limit | -3.5% | หยุด 3 วัน |
| Monthly limit | -5% | หยุดทั้งเดือน + รีวิว |
| SL style | ATR × 1.5 | ไม่โดนสะบัด noise |
| TP style | RSI2 > 70 | ออกเร็ว lock กำไรสั้น |

---

## Recovery Plan หลังโดน Circuit Breaker

```
โดน Weekly limit (-3.5%)
    ↓
หยุด 3 วัน
    ↓
รีวิว: ADX ตลาดช่วงนั้นเป็นเท่าไหร่?
       ถ้า ADX > 25 ตลอดสัปดาห์ = ระบบไม่ผิด แค่ตลาดไม่เหมาะ
       ถ้า ADX < 20 แต่ยังขาดทุน = มีปัญหาใน signal logic
    ↓
กลับมาเทรดด้วย position size ครึ่งนึงก่อน (0.5%)
    ↓
ถ้า 2 สัปดาห์ถัดไปไม่ติดลบ → กลับ 1% ปกติ
```


**Bottom line:** ระบบที่ดีไม่ใช่แค่ "เข้าเมื่อไหร่" แต่คือ **"รู้ว่าจะหยุดเมื่อไหร่"** Circuit breaker ที่ชัดเจนคือสิ่งที่แยก systematic trader ออกจาก gambler ครับ

ถ้าอยากให้ช่วย implement เป็น full scanner + risk manager ใน Go บอกได้เลย
</risk_management_crypto>

<output_format>

- ขอโครงสร้าง Folder (Tree view)
- โค้ดที่พร้อม Copy-Paste (แยกไฟล์ชัดเจน)
- คำอธิบายสั้นๆ เกี่ยวกับการติดตั้ง Library ที่จำเป็น
  </output_format>


<rule>
1. **Deterministic-First (กฎคณิตศาสตร์ต้องแน่นอน):** เครื่องมือ, Indicator และสูตรคำนวณทั้งหมด ต้องเขียนด้วย Logic (เช่น If/Else, Math) ที่คำนวณซ้ำแล้วได้ผลลัพธ์เดิม 100% **ห้ามให้ AI/LLM เป็นคนคิดคำนวณตัวเลขเองเด็ดขาด** เพื่อป้องกันปัญหาข้อมูลหลอน (Hallucination)
2. **Free & Single-User Minimalism:** ระบบนี้ใช้คนเดียว ไม่ต้องทำระบบสมัครสมาชิก (Auth), ไม่ต้องทำ Multi-tenant ข้อมูลทั้งหมดเก็บฝั่ง Client (IndexedDB) และดึง API ผ่าน Free Tier ทั้งหมด
3. ใช้หลัก SOLID Principles
4. ใช้หลักการ clean code
6. หากมีอะไรสงสัยให้ตั้งคำถาม ห้ามเดา ห้ามคิดเอง ให้ถาม เสนอไอเดีย ให้ข้อมูลแนะนำมาได้
</rule>

<technique>
 1. Mobile UX:** ออกแบบเป็น Single-column สำหรับหน้าจอ iPhone รองรับการกดด้วยนิ้วโป้งมือเดียว (ปุ่มกดขนาดอย่างน้อย 44x44px) ตั้งค่าเป็น Dark Mode เป็นหลัก
 2. PWA Standard:** มี `manifest.json` และ `sw.js` (Service Worker) เพื่อรองรับการกด "Add to Home Screen" บน iOS ให้แสดงผลเต็มจอแบบ Native App
- **Client Storage:** ใช้ **IndexedDB** สำหรับเก็บข้อมูล
</technique>
