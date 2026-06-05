import { BookOpen, AlertCircle, TrendingUp, DollarSign } from 'lucide-react';

export default function Guide() {
  return (
    <div className="h-full overflow-y-auto pb-24 bg-slate-900 text-white">
      <div className="p-6">
        <h1 className="text-2xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
          คู่มือการใช้งาน & ทฤษฎีการเทรด
        </h1>

        <div className="space-y-6">
          <section className="bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700">
            <div className="bg-slate-700/50 p-4 border-b border-slate-700 flex items-center">
              <BookOpen size={20} className="text-blue-400 mr-2" />
              <h2 className="font-bold">1. การตั้งค่าระบบ (API Configuration)</h2>
            </div>
            <div className="p-4 text-sm text-slate-300 space-y-4">
              <p>
                <strong>โหมด Crypto:</strong> ใช้งานได้ทันทีโดยไม่ต้องตั้งค่า! ระบบจะดึงรายชื่อเหรียญ Top 100+ (Market Cap &gt; $1B) จาก CoinGecko และดึงกราฟจาก Binance Public API อัตโนมัติ
              </p>
              <p>
                <strong>โหมด Forex:</strong> ระบบจะสแกน 7 คู่เงินหลัก (EUR/USD, GBP/USD, USD/JPY, USD/CHF, AUD/USD, USD/CAD, XAU/USD) 
                โดยจำเป็นต้องใช้ API Key จาก <strong>TwelveData</strong> ในการดึงข้อมูล
              </p>
              <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-500/20">
                <p className="text-blue-300 font-semibold mb-1">วิธีขอ API Key ของ TwelveData (ฟรี):</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>ไปที่เว็บ <a href="https://twelvedata.com" target="_blank" rel="noreferrer" className="text-blue-400 underline">twelvedata.com</a> และสมัครสมาชิก (ล็อกอินด้วย Google ได้เลย)</li>
                  <li>เข้าไปที่ Dashboard คัดลอก API Key ของคุณ</li>
                  <li>นำไปวางในแท็บ <strong>Settings</strong> ของแอปนี้</li>
                </ol>
                <p className="mt-2 text-xs text-blue-200">
                  <em>หมายเหตุ: บัญชีฟรีจำกัดโควต้า 8 ครั้ง/นาที แอปของเรามีระบบ Cache จำกราฟไว้ 5 นาที เพื่อช่วยให้คุณกดสแกนรัวๆ ได้โดยไม่โดนแบนครับ!</em>
                </p>
              </div>
            </div>
          </section>

          <section className="bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700">
            <div className="bg-slate-700/50 p-4 border-b border-slate-700 flex items-center">
              <TrendingUp size={20} className="text-emerald-400 mr-2" />
              <h2 className="font-bold">2. ทฤษฎี Forex (Trend Pullback)</h2>
            </div>
            <div className="p-4 text-sm text-slate-300 space-y-3">
              <p>สแกนเนอร์ Forex ใช้กลยุทธ์ 3 ขั้นตอน เพื่อดักจับจังหวะ "ย่อเพื่อไปต่อ" ในตลาดที่เป็นเทรนด์ชัดเจน</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-white">ด่าน 1: กรองเทรนด์ (กราฟ Day)</strong> - ราคาต้องยืนเหนือ EMA50 และเส้น EMA50 ต้องอยู่สูงกว่า EMA200 (เพื่อให้แน่ใจว่าเป็นขาขึ้นชัวร์ๆ)</li>
                <li><strong className="text-white">ด่าน 2: หาจุดเข้า (กราฟ H4)</strong> - รอให้กราฟย่อตัวลงมาจนค่า RSI(14) ตกมาอยู่ในโซน 35-55 แล้วงัดหัวขึ้น (เผื่อพื้นที่ให้ความผันผวนของตลาดแล้ว)</li>
                <li><strong className="text-white">ด่าน 3: คำนวณความเสี่ยง (ATR)</strong> - วางจุดตัดขาดทุน (SL) ที่ 1.5 เท่าของค่าความผันผวน ATR(14) และจุดทำกำไร (TP) ที่ 3 เท่า (Risk/Reward 1:2)</li>
              </ul>
            </div>
          </section>

          <section className="bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700">
            <div className="bg-slate-700/50 p-4 border-b border-slate-700 flex items-center">
              <AlertCircle size={20} className="text-amber-400 mr-2" />
              <h2 className="font-bold">3. ทฤษฎี Crypto (Larry Connors RSI)</h2>
            </div>
            <div className="p-4 text-sm text-slate-300 space-y-3">
              <p>สำหรับเหรียญใหญ่ เราใช้กลยุทธ์ระดับตำนานอย่าง <strong>Larry Connors RSI(2)</strong> เพื่อดักซื้อจังหวะตื่นตระหนก (Panic Sell) สั้นๆ ในตลาดขาขึ้น</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-white">ด่าน 1: ภาพรวมเป็นขาขึ้น</strong> - ราคาต้องยืนเหนือเส้น EMA200 อย่างชัดเจน (แปลว่าตลาดกำลังเป็นกระทิง ดึงดูดแรงซื้อ)</li>
                <li><strong className="text-white">ด่าน 2: ร่วงระยะสั้น</strong> - ราคาปัจจุบันต้องมุดลงไปต่ำกว่าเส้น EMA5 (เกิดการเทขายทำกำไรระยะสั้น)</li>
                <li><strong className="text-white">ด่าน 3: จังหวะเข้าสไนเปอร์</strong> - ค่า RSI แบบ 2 วัน (RSI 2) ต้องตกฮวบลงไปต่ำกว่า 20 เพื่อส่งสัญญาณว่านี่คือจุด Oversold ที่ลึกสุดๆ ชั่วคราว ให้ช้อนซื้อสวนกลับทันที!</li>
              </ul>
            </div>
          </section>

          <section className="bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700">
            <div className="bg-slate-700/50 p-4 border-b border-slate-700 flex items-center">
              <DollarSign size={20} className="text-purple-400 mr-2" />
              <h2 className="font-bold">4. Risk Management & Journal (ใหม่!)</h2>
            </div>
            <div className="p-4 text-sm text-slate-300 space-y-3">
              <p>ระบบจดบันทึกและจัดการความเสี่ยง ถูกอัปเกรดเป็น <strong>Real-time Portfolio Tracker</strong> เต็มรูปแบบ</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-white">การแบ่งหมวดหมู่:</strong> หน้า Journal จะมีแท็บแยก Forex และ Crypto ออกจากกันชัดเจน (รวมถึงการแยกสรุป Win Rate และ PnL ออกจากกันด้วย)</li>
                <li><strong className="text-white">Auto-Trigger (รอเข้าซื้ออัตโนมัติ):</strong> เมื่อกดบันทึกจากหน้าสแกน สถานะจะเริ่มที่ <strong>PENDING</strong> ระบบจะย้อนเช็คกราฟให้ตลอดเวลา ถ้าราคาตลาดวิ่งไปแตะราคา Entry ที่คุณตั้งไว้ สถานะจะเปลี่ยนเป็น <strong>ACTIVE (เข้าซื้อแล้ว)</strong> ให้ทันที!</li>
                <li><strong className="text-white">Auto-Expire:</strong> ถ้าทิ้งออเดอร์ PENDING ไว้เกิน 24 ชั่วโมงแล้วตลาดยังไปไม่ถึง ระบบจะยกเลิกออเดอร์ (Expired) และคืนเงิน Margin กลับเข้าพอร์ตให้อัตโนมัติ</li>
                <li><strong className="text-white">Real-time PnL:</strong> ออเดอร์ที่ ACTIVE อยู่ จะโชว์กำไร/ขาดทุนลอยตัว (Floating PnL) อัปเดตสดๆ ทุก 15 วินาที พร้อมไฟกระพริบ</li>
                <li><strong className="text-white">ปิดออเดอร์:</strong> เมื่อออเดอร์ชนเป้า ให้กดปุ่ม WIN / LOSS ด้วยตัวเอง ระบบจะเคลียร์บัญชีและทบต้นกำไรเข้าเงินทุนให้ทันที</li>
              </ul>
            </div>
          </section>

          <section className="bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700">
            <div className="bg-slate-700/50 p-4 border-b border-slate-700 flex items-center">
              <AlertCircle size={20} className="text-red-400 mr-2" />
              <h2 className="font-bold">5. ข่าวเศรษฐกิจ (Fundamental Analysis)</h2>
            </div>
            <div className="p-4 text-sm text-slate-300 space-y-3">
              <p>ระบบสแกนเนอร์ของเรามีฟังก์ชันเตือน <strong>"ข่าวกล่องแดง (High Impact)" และ "ข่าวกล่องส้ม (Medium Impact)"</strong> อัตโนมัติ หลักการใช้งานมีดังนี้:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-white">ขอบเขตเวลา (24 ชั่วโมง):</strong> ข่าวเศรษฐกิจมักจะมีผลกระทบ (Impact) รุนแรงเฉพาะ <strong>"ภายในวันที่ประกาศ"</strong> เท่านั้น ระบบจึงถูกเขียนให้เช็คข่าวล่วงหน้าแค่ 24 ชั่วโมง หากมีข่าวใหญ่ภายใน 24 ชั่วโมง ระบบจะขึ้นป้ายเตือนสีแดงในการ์ดที่สแกนติดทันที</li>
                <li><strong className="text-white">หลีกเลี่ยงการเข้าเทรด:</strong> สำหรับสาย Swing Trade หากระบบเตือนว่าคู่เงินนั้นกำลังจะมีข่าวกล่องแดงในวันนั้น <strong>คำแนะนำคือ "ไม่ควรเข้าเทรด (Skip)"</strong> เพื่อป้องกันกราฟสวิงกวาด Stop Loss จากความผันผวนชั่วคราว</li>
                <li><strong className="text-white">หมดวันคือจบ:</strong> เมื่อข่าวประกาศจบลงและตลาดซึมซับรับรู้ไปแล้ว (ผ่านไป 1 วัน) กราฟจะกลับมาวิ่งตามเทคนิคอลปกติ คุณสามารถกลับมาหาจังหวะเข้าเทรดคู่เงินนั้นได้ตามเดิม</li>
              </ul>
            </div>
          </section>

          <section className="bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700">
            <div className="bg-slate-700/50 p-4 border-b border-slate-700 flex items-center">
              <BookOpen size={20} className="text-pink-400 mr-2" />
              <h2 className="font-bold">6. อภิธานศัพท์การเทรด (Trading Glossary)</h2>
            </div>
            <div className="p-4 text-sm text-slate-300 space-y-3">
              <p>รวมคำศัพท์เทคนิคทั้งหมดที่ปรากฏอยู่ในแอปพลิเคชันนี้ เพื่อให้คุณเข้าใจความหมายและวิธีการใช้งาน</p>
              
              <div className="space-y-4 mt-2">
                <div>
                  <strong className="text-blue-300 block mb-1">EMA (Exponential Moving Average)</strong>
                  <p>เส้นค่าเฉลี่ยเคลื่อนที่แบบถ่วงน้ำหนัก ให้ความสำคัญกับราคาล่าสุดมากกว่าอดีต ในแอปเราใช้ <span className="text-white">EMA200</span> เพื่อแยกเทรนด์ใหญ่ และ <span className="text-white">EMA50</span> เพื่อดูเทรนด์ระยะกลาง</p>
                </div>
                
                <div>
                  <strong className="text-blue-300 block mb-1">RSI (Relative Strength Index)</strong>
                  <p>ดัชนีวัดความแข็งแกร่งของแรงซื้อแรงขาย ค่าตั้งแต่ 0-100 หากต่ำกว่า 30 แปลว่ามีการเทขายมากเกินไป (Oversold) มีโอกาสเด้งกลับสูง</p>
                </div>

                <div>
                  <strong className="text-blue-300 block mb-1">ADX (Average Directional Index)</strong>
                  <p>อินดิเคเตอร์วัด "ความแรงของเทรนด์" (ไม่ได้บอกทิศทาง) ถ้า ADX &lt; 25 แปลว่าตลาดกำลังพักตัววิ่งออกข้าง (Sideway) ถ้า ADX &gt; 25 แปลว่าตลาดกำลังมีเทรนด์ที่แข็งแรง</p>
                </div>

                <div>
                  <strong className="text-blue-300 block mb-1">ATR (Average True Range)</strong>
                  <p>ค่าวัด "ความผันผวน" หรือกรอบการแกว่งตัวของราคาในแต่ละวัน เราใช้ ATR มาคำนวณจุด Stop Loss เพื่อหนีระยะสวิงของตลาด ไม่ให้โดนกิน Stop Loss ฟรีๆ</p>
                </div>

                <div>
                  <strong className="text-blue-300 block mb-1">PnL (Profit and Loss)</strong>
                  <p>กำไรและขาดทุน แบ่งเป็น <span className="text-white">Floating PnL</span> (กำไร/ขาดทุนลอยตัวที่ออเดอร์ยังวิ่งอยู่) และ <span className="text-white">Realized PnL</span> (กำไร/ขาดทุนที่ปิดรับรู้เข้าพอร์ตไปแล้ว)</p>
                </div>

                <div>
                  <strong className="text-blue-300 block mb-1">Stop Loss (SL) & Take Profit (TP)</strong>
                  <p><strong>SL</strong> = จุดตัดขาดทุนเมื่อผิดทาง เพื่อจำกัดความเสี่ยง, <strong>TP</strong> = จุดทำกำไรเมื่อกราฟวิ่งไปถึงเป้าหมาย</p>
                </div>

                <div>
                  <strong className="text-blue-300 block mb-1">Position Size & Margin</strong>
                  <p><strong>Position Size</strong> คือขนาดของไม้ที่ออก (จำนวนเหรียญ/จำนวน Lot), <strong>Margin</strong> คือเงินลงทุนจริงๆ ที่เราถูกหักไปค้ำประกันการเปิดออเดอร์นั้น</p>
                </div>

                <div>
                  <strong className="text-blue-300 block mb-1">Mean Reversion vs Trend Pullback</strong>
                  <p><strong>Mean Reversion:</strong> ทฤษฎีของคริปโตที่เชื่อว่าเมื่อราคากระชากลงรุนแรงเกินไป มันจะถูกดึงกลับเข้าหาค่าเฉลี่ย<br/><strong>Trend Pullback:</strong> ทฤษฎีของ Forex ที่รอให้ราคาในเทรนด์ขาขึ้น เกิดการ "ย่อตัว" ลงมาพักฐาน ก่อนจะเข้าซื้อเพื่อให้มันวิ่งไปตามเทรนด์เดิม</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
