# Hướng dẫn đưa game lên Poki

Áp dụng cho mọi game đi đường A (Poki), bắt đầu từ game #3. Tổng hợp từ bộ Developer Guide của Poki, đọc ngày 15/10/2026 (danh sách nguồn ở cuối). Poki có thể đổi quy định, nên trước mỗi lần nộp hãy mở lại trang Requirements để so.

Cách dùng file này:

1. Trước khi code: đọc mục 1–3 để biết luật chơi của Poki.
2. Trong lúc làm: bám theo mục 4–10.
3. Trước mỗi lần upload: chạy hết checklist ở mục 11.

Mục 12 ghi bộ khung chung đã làm sẵn những gì. Mục 13 là kết quả kiểm tra Pond Pals (game #3) theo file này.

---

## 1. Poki chọn game theo tiêu chí nào

Poki tự tay chọn từng game, mỗi ngày chỉ phát hành vài game, và không công bố điểm chuẩn cố định. Họ cân nhắc tổng thể các mặt sau:

| Tiêu chí | Poki nhìn vào gì |
| --- | --- |
| Chất lượng | Cảm giác chơi, UX và vòng chơi chính. Mức chuẩn là các game trên trang chủ Poki. |
| Hợp người chơi | Khán giả của Poki (đông nhất là mobile, nhiều trẻ em) có muốn chơi không. |
| Kỹ thuật | Tải nhanh, khung hình ổn định, file nhẹ trên cả mobile lẫn desktop. |
| Độc đáo | Có ý tưởng hoặc cơ chế mới. Clone sẽ không được quảng bá, sao chép quá nhiều thì bị từ chối. |
| Chiều sâu | Vòng chơi mở rộng dần theo thời gian, giữ người chơi tốt hơn một ý tưởng hay đơn lẻ. |
| Ấn tượng đầu | Thumbnail rõ ràng và chơi được ngay trong vài giây. |
| Đa thiết bị | Điều khiển và UI dùng tốt bằng ngón tay lẫn chuột. |
| Đất để lớn | Có chỗ thêm nội dung sau này. Nên kèm lộ trình cập nhật khi nộp. |

**Lý do từ chối hay gặp:** game lỗi, file quá nặng hoặc chạy chậm, UX khó hiểu, đồ họa kém hoặc không đồng nhất, nội dung không an toàn, clone hoặc dùng IP người khác. Game trùng quá nhiều với những gì Poki đã có trong cùng thể loại cũng có thể bị từ chối.

## 2. Quy trình từ lúc nộp đến khi phát hành

| Bước | Nội dung | Thời gian | Điều kiện để qua |
| --- | --- | --- | --- |
| 0. Vào P4D | Đăng nhập app.poki.dev, đọc Terms & Conditions, tạo game. | — | — |
| 1. Upload | Upload bản web (bản sớm cũng được). Mỗi version phải qua kiểm duyệt nội dung. | vài giờ | Qua content moderation |
| 2. Playtest | Mỗi lượt có 10 video người chơi thật. Video kèm thao tác, console, thời gian chơi, quốc gia, thiết bị. Chạy bao nhiêu lượt cũng được. | vài phút đến vài giờ | Xem đủ 10 video thì mở được bước 3 |
| 3. Player Fit Test | 500 người chơi, chỉ đo thời gian chơi. Cần có thumbnail và đặt hướng màn hình cho mobile. Tối đa 2 lần/ngày. | khoảng 5 giờ | **Trung bình trên 3 phút và ít nhất 25% lượt chơi trên 3 phút** |
| 4. Web Fit Test | Game nằm trên trang thể loại thật, khoảng 10.000 người chơi. Chấm CTR, thời gian trên trang, C2P (0–5 điểm mỗi mục so với trung bình thể loại; 3 là ngang trung bình). Đã bắt đầu thì không dừng được. | 3–7 ngày | Bắt buộc có `gameplayStart()`. Qua thì tự vào Final review. |
| 5. Final review | Đội Poki xem kết quả, tự chơi, đánh giá chất lượng, độ độc đáo, độ hợp thể loại. | 1–2 tuần | Được duyệt thì Poki đề nghị hợp đồng |
| 6. Agreement | Ký hợp đồng (mục 3). | — | — |
| 7. QA | Poki kiểm game theo trang Requirements, gửi báo cáo lỗi. Sửa, upload, xin review, lặp đến khi qua. | tùy | Qua toàn bộ QA |
| 8. Soft Release | Lên các trang thể loại, chưa lên trang chủ. Không bỏ qua được. **Cần animated thumbnail trước global.** | xếp lịch 1–2 tuần, chạy 2–3 tuần | Theo dõi C2P, lỗi, quảng cáo (≥ 1 quảng cáo/người chơi/ngày) |
| 9. Global Release | Toàn cầu, vào hệ thống quảng bá, khoảng 2 tuần được đẩy thêm, có biểu tượng lửa "mới". | 2–3 tuần sau soft | — |

Từ lúc được duyệt ở Final review đến Global Release mất khoảng **2–3 tháng**.

**Mục tiêu số nên đạt trước khi xin review:**

| Chỉ số | Mục tiêu | Trung bình Poki |
| --- | --- | --- |
| C2P (tỉ lệ người mở game đến được `gameplayStart()` đầu tiên) | **≥ 65%** | khoảng 70% |
| Thời gian chơi trung bình | **≥ 5 phút** (game quản lý/mô phỏng ≥ 10 phút) | 6+ phút |
| Quảng cáo khi soft release | ≥ 1 quảng cáo/người chơi/ngày, chia giữa midroll và rewarded | — |

**Đọc kết quả để sửa đúng chỗ:**

| Dấu hiệu | Nguyên nhân thường gặp | Sửa ở đâu |
| --- | --- | --- |
| Người chơi bỏ trong phút đầu (biểu đồ lệch trái) | Hướng dẫn, tải chậm | Mục 6 |
| Bắt đầu tốt, rơi ở giữa biểu đồ | Thiếu nội dung hoặc thiếu móc giữ chân | Mục 8 |
| Chơi lâu nhưng CTR thấp | Thumbnail | Mục 10 |
| CTR tốt nhưng C2P thấp | Dung lượng, tốc độ tải | Mục 5 |
| Vào chơi rồi bỏ nhanh | Thumbnail hứa quá, hoặc khó quá sớm | Mục 8 và 10 |

Mỗi lần chỉ sửa một chỉ số yếu nhất rồi test lại. Test miễn phí và chạy lại được.

## 3. Hợp đồng và độc quyền

| | Độc quyền web (Poki ưu tiên) | Không độc quyền |
| --- | --- | --- |
| Phạm vi | Mọi nền tảng web: trình duyệt, **Discord, YouTube Playables**. Steam, app store, console vẫn của mình. | — |
| Thời hạn | Mặc định 5 năm (mang tính tham khảo) | — |
| Doanh thu | Người chơi Poki mang tới: chia **50/50**. Người chơi tự đến (bookmark, tìm kiếm, mạng xã hội, cộng đồng của mình): **100%** cho mình. | Một khoản phí bản quyền trả một lần |
| Dành cho | Game mới, hợp khán giả Poki | Game đã có trên portal khác hoặc ít hợp |

**Hệ quả cho dự án:** game đi đường A thì không đưa lên CrazyGames, Y8, Discord hay YouTube Playables trước khi có kết quả từ Poki. Trang chơi thử riêng tư (chỉ mình mở) không tính là phát hành.

## 4. Yêu cầu bắt buộc (hard requirements)

- [ ] **Chạy trên desktop, mobile và tablet.** Trên mobile, game phủ kín màn hình ở dọc, ngang hoặc cả hai (Poki khuyên hỗ trợ cả hai, ít nhất phải có **màn dọc**). Tablet dùng điều khiển kiểu mobile.
- [ ] **Desktop 16:9**, game phủ hết khung và co giãn đúng tỉ lệ ở 640×360, 836×470, 1031×580.
- [ ] **Chế độ ẩn danh:** mọi lệnh `localStorage` nằm trong try/catch, game vẫn chơi được khi không lưu được.
- [ ] **Không gọi ra ngoài:** font, ảnh, âm thanh, thư viện đều đóng gói trong build. Không Google Fonts, không CDN (jsDelivr…). Ngoại lệ (server multiplayer, analytics không phải của Google, leaderboard) phải xin qua P4D, mục Settings → CSP, kèm privacy policy.
- [ ] **Không splash screen, không link ra ngoài.** Logo studio chỉ được đặt ở màn tải.
- [ ] **Chỉ dùng quảng cáo của Poki SDK**, không mạng quảng cáo nào khác.
- [ ] **Bật chặn quảng cáo vẫn chơi được.** Không tự hiện thông báo kiểu "bạn đang chặn quảng cáo"; Poki tự lo việc đó.
- [ ] **Build sạch:** không công cụ debug, không code thử nghiệm, không preset dev.
- [ ] **Lưu tiến trình** (hoặc báo rõ cho người chơi là thoát ra sẽ mất).
- [ ] **Cuộn trong game không làm cuộn trang Poki** (chặn phím mũi tên, Space, con lăn).
- [ ] **Không mua trong game:** không nút mua tiền, không nút "tắt quảng cáo".
- [ ] **Không chat, không đăng nhập bằng email/Google/Facebook, không thu thập thông tin cá nhân.** Muốn người chơi giao tiếp thì dùng emoji.
- [ ] **Link ra ngoài (nếu thật sự cần)** phải gọi `PokiSDK.openExternalLink(url)`, cần UI privacy policy trong game và URL policy thật (không nhận link Google Doc).

## 5. SDK và kỹ thuật

### 5.1 Tích hợp

```html
<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>  <!-- trong <head> -->
```

- `PokiSDK.init()` khi bắt đầu; **thành công hay thất bại đều vào game** (người chặn quảng cáo vẫn phải chơi được).
- `gameLoadingFinished()` khi tải xong. Chỉ số C2P tính từ đây.
- `gameplayStart()` khi người chơi **bắt đầu thao tác lần đầu (không phải lúc tải xong)**, khi vào màn, khi bỏ pause.
- `gameplayStop()` ở **mọi lần gián đoạn**: pause, mở menu, hết màn, thua, cutscene.
- `commercialBreak(onStart)` ở chỗ nghỉ tự nhiên, **ngay trước khi quay lại chơi**. Gọi càng nhiều cơ hội càng tốt; Poki tự quyết khi nào thật sự chiếu quảng cáo.
- `rewardedBreak({ size, onStart })` chỉ khi người chơi tự bấm; trả về `true` mới trao thưởng. Rewarded cũng reset bộ đếm midroll.
- Trong lúc quảng cáo chạy: **dừng game, tắt tiếng, khóa input**; không gửi bất kỳ sự kiện SDK nào.

### 5.2 Thứ tự sự kiện chuẩn

| Tình huống | Chuỗi sự kiện |
| --- | --- |
| Mở game | `gameLoadingFinished` → (lần chạm đầu) `gameplayStart` |
| Thua, chơi lại | `gameplayStop` → `commercialBreak` → `gameplayStart` |
| Thua, hồi sinh bằng quảng cáo | `gameplayStop` → `rewardedBreak` → `gameplayStart` |
| Qua màn | `gameplayStop` → `commercialBreak` → `gameplayStart` |
| Pause, bỏ pause | `gameplayStop` → `commercialBreak` → `gameplayStart` |
| Quảng cáo trong menu không làm gián đoạn chơi (ví dụ mở khóa skin) | không cần stop/start bao quanh |

**Lỗi hay gặp:**

- Gọi hai `gameplayStart` (hoặc hai `gameplayStop`) liền nhau.
- Gọi `gameplayStart` lúc tải xong.
- Gọi `commercialBreak` lúc **rời** gameplay để vào menu. Đúng là gọi lúc **từ menu quay lại** gameplay.

### 5.3 Các hàm khác

- `PokiSDK.getLanguage()` (đồng bộ) trả về mã ngôn ngữ gốc, ví dụ `en` hay `pt`.
- `PokiSDK.shareableURL({...})` và `PokiSDK.getURLParam(name)` dùng cho link chia sẻ; tham số có tiền tố `gd` trên Poki.com.
- `PokiSDK.movePill(topPercent, topPx)`: nút Poki ở góc trên trái trên mobile, mặc định `movePill(0, 24)`. Nút rộng 46×62 px khi màn dưới 1211 px, 92×64 px khi từ 1211 px trở lên. **Không đặt UI vào vùng này.**
- `PokiSDK.measure(category, what, action)` (tùy chọn) để theo dõi phễu, ví dụ `('level','1','start')`. Không dùng "/" hay "^"; không gửi trùng các sự kiện quảng cáo.
- Tài khoản Poki và lưu đám mây (nếu Poki bật cho game): SDK tự đồng bộ `localStorage`/`IndexedDB`, bản lưu phải dưới 1 MB sau gzip. Khóa bắt đầu bằng `poki_ignore` thì không đồng bộ.
- Phaser có plugin `@poki/phaser-3`, nhưng plugin chỉ tự gửi event theo scene. Game một scene (như dự án mình) phải tự gọi start/stop.

### 5.4 Dung lượng và tải

- **Lần tải đầu ≤ 5 MB, tổng ≤ 8 MB.** Phaser rỗng khoảng 290 KB.
- Người chơi bỏ đi nếu phải chờ trên 10 giây. Tải phần cần trước (menu, tutorial, màn đầu), phần còn lại tải nền.
- Màn tải có thanh tiến trình và logo hoặc key art, để không ai tưởng game bị treo.
- Ảnh nén tốt (Inspector cảnh báo ảnh chưa tối ưu).

### 5.5 Poki Inspector (inspector.poki.dev)

Kéo thư mục build (có `index.html`) vào Inspector, hoặc mở từ tab Versions trong P4D.

- Đi hết các mục QA, đánh dấu từng mục đạt.
- Xem Event Log để kiểm thứ tự sự kiện.
- Thử trên điện thoại bằng mã QR, chạy Scaling Tests.
- Xử lý hết các cảnh báo: External Resources, Image Optimization, **Unexpected Behavior** (bắt buộc sửa).
- Có ô chọn ngôn ngữ để thử bản dịch.
- Upload từ dòng lệnh hoặc CI: `poki-cli`.

## 6. Trải nghiệm vào game (C2P và phút đầu)

- Người mới **vào thẳng gameplay**: không splash, không màn tiêu đề, không chọn màn.
- Hướng dẫn bằng **hình, hoạt ảnh, cử chỉ**, càng ít chữ càng tốt. Giới thiệu từng nút một qua vài màn đầu, đừng dồn một lúc.
- Màn đầu dễ, gần như không thể thua; độ khó tăng dần, không nhảy vọt.
- Cutscene và intro phải bỏ qua được.
- Hiển thị điều khiển theo thiết bị: nút cảm ứng trên mobile/tablet, gợi ý phím trên desktop.
- Game có bàn phím: **ESC hoặc Space để pause/resume**, gửi đúng sự kiện SDK. Menu đi được bằng WASD hoặc mũi tên; Space/Enter là hành động chính.
- Dễ tiếp cận: có cách chơi chỉ bằng chuột hoặc chạm, không bắt buộc WASD.
- **Hỗ trợ màn dọc:** nhiều người vào chơi hơn và đủ điều kiện cho quảng cáo Gamebar Display.
- Xem video playtest để tìm đúng giây người chơi bỏ đi.

## 7. Quảng cáo, kinh tế và nút thưởng

### 7.1 Kinh tế

- **Một loại tiền duy nhất.** Hai loại tiền (xu + đá quý) là kiểu mobile để ép mua; trên web chỉ gây rối và cày cuốc.
- Không mua trong game. Quảng cáo Poki là nguồn thu duy nhất.
- **Không tự đặt bộ đếm giờ hay cooldown cho tần suất quảng cáo.** Poki quản lý tần suất; giới hạn phần thưởng thì dựa vào trạng thái game, không dựa vào đồng hồ quảng cáo.
- Rewarded luôn là **tùy chọn**. Bắt xem quảng cáo mới qua được thì trượt review.
- Đừng mời xem quảng cáo dồn dập.

Ba kiểu rewarded hiệu quả:

- **Giúp một tay:** hồi sinh, bỏ qua màn, gợi ý, tăng sức mạnh, tăng tốc.
- **Kinh tế:** chọn giữa tiêu xu hoặc xem video; nhân thưởng.
- **Tùy biến:** mở khóa cosmetic hoặc nhạc.

### 7.2 Quy tắc nút thưởng (QA kiểm từng điểm)

- [ ] Luôn có **nút thường** (miễn phí) hiện **cùng lúc** với nút thưởng.
- [ ] Nút thường **to bằng hoặc to hơn** nút thưởng, đặt **bên cạnh hoặc phía trên** nó.
- [ ] Nút thưởng **không được màu xanh lá**.
- [ ] Mọi nút thưởng có **biểu tượng video 🎬 nổi bật**.
- [ ] Không đặt nút để lừa người chơi bấm nhầm.
- [ ] Một phần thưởng chỉ cần **một** video; không trao thưởng hai lần.
- [ ] Phần thưởng được ăn mừng (hoạt ảnh, âm thanh) và **tự áp dụng ngay** nếu được.
- [ ] Phát hiện chặn quảng cáo thì **không trao thưởng và không tự hiện thông báo**.
- [ ] Tự tắt tiếng game khi quảng cáo chạy.

## 8. Giữ chân người chơi

- Vòng chơi chính ngắn, khoảng **3 phút**, thỏa mãn và lặp lại được.
- Toàn bộ nội dung khoảng **1 giờ**. Tránh chuỗi tiến trình dài kiểu game mobile.
- **Phiên đầu là phiên quyết định.**
- Ăn mừng các mốc (pháo giấy, âm thanh, lời khen); có mục tiêu ngắn hạn lẫn dài hạn.
- Người chơi lúc nào cũng có việc để làm; tránh bắt chờ.
- Không có con số nào trong guide đòi daily login hay offline. Đó là thêm cho tốt, không thay được vòng chơi hay.

## 9. Nội dung, an toàn, độc đáo và AI

- **Không được có:** bắt nạt, lạm dụng, định kiến, phân biệt giới; bạo lực máu me (vết thương, dịch cơ thể); chủ đề kinh dị kéo dài; tình dục hoặc trang phục hở hang; gian lận, cờ bạc, rượu, thuốc lá. IP người khác và chủ đề người lớn bị **từ chối ngay**.
- **Đỡ nhẹ hơn:** hẹn hò nhẹ, đùa gợi ý, cảnh bạo lực có thể sửa và nộp lại.
- **Độc đáo:** Poki so 6 mặt: phong cách vẽ, cơ chế chính, tiến trình và kinh tế, UI/icon/âm thanh, nhân vật, tên và thumbnail. Lấy cảm hứng thì được; sao chép hình, vòng chơi, bố cục, tên gần giống game hot thì không. Template hay asset flip ít sửa không tính là sản phẩm gốc.
- **AI:** được dùng để tăng tốc, nhưng sản phẩm phải mang dấu ấn và chỉnh sửa của mình.
  - Không để watermark AI hay chữ prompt còn sót.
  - Mọi nội dung sinh ra đều phải được chơi thử.
  - Ảnh, UI, thumbnail phải cùng một phong cách.
  - **Sẵn sàng trình bày công cụ đã dùng, quy trình, prompt và các vòng chỉnh sửa khi Poki hỏi.** Giữ lại lịch sử phiên làm việc và repo git.
  - Nên ghi công minh bạch, ví dụ "Some UI art generated with … and refined in …".
- **Theo trend:** được, nhưng phải có góc nhìn mới; thể loại đã đông thì Poki có thể từ chối thêm.

## 10. Thumbnail và trang game

**Thumbnail tĩnh** (cần trước Player Fit Test):

- Vuông 1:1, **tối thiểu 628×628 px**, tràn viền; không bo góc, không viền, không chừa lề.
- **Không có chữ, kể cả tên game.**
- Một vật thể nổi bật (nhân vật chính, skin mặc định), dáng động, nền đơn giản, tương phản mạnh.
- **Tránh màu gần `#83FFE7`** (màu nền trang Poki).
- Đúng với hình trong game. Xem lại ở cỡ nhỏ.

**Thumbnail động** (thêm trong Soft Release, bắt buộc trước Global):

- `.mp4`, 1:1, **≥ 1080×1080**, **≥ 50 fps**, **4–6 giây**, tắt tiếng, tối đa 100 MB.
- 2–3 cảnh, mỗi cảnh 1–2 giây; mở đầu từ ảnh tĩnh; ẩn UI phụ, giữ hành động ở giữa; không có con trỏ chuột.

**Đổi thumbnail:**

- Lúc phát triển: đổi thoải mái, trừ khi đang chạy Web Fit Test.
- Sau Web Fit Test: phải được Developer Support duyệt.
- Sau phát hành: chỉ đổi khi có cập nhật nội dung lớn.

**Cài đặt game trong P4D:**

- Tên game.
- Tối đa 4 thể loại gợi ý.
- Mô tả cơ chế chính và điểm khác biệt (Poki tự viết lại mô tả chuẩn SEO).
- Hướng màn hình mobile.

## 11. Checklist trước mỗi lần upload

**Kỹ thuật**

- [ ] `npm run build` (target `poki`) xanh; build ≤ 5 MB lần tải đầu, ≤ 8 MB tổng.
- [ ] Không còn URL ngoài trong build. `scripts/check-build.mjs` chỉ được báo domain `game-cdn.poki.com`.
- [ ] Không còn debug overlay, preset dev, hook test trong build portal.
- [ ] Chạy thử với giả lập SDK (`tools/poki-events.mjs`): `gameLoadingFinished` lúc tải; `gameplayStart` chỉ sau lần chạm đầu; không cặp start/start hay stop/stop; mở/đóng menu ra `stop → commercialBreak → start`.
- [ ] Inspector: qua hết QA modules, không còn cảnh báo, Event Log đúng.
- [ ] Bật chặn quảng cáo: vào game được, chơi được, nút thưởng không trao thưởng và không có thông báo tự chế.
- [ ] Ẩn danh: chơi được, không lỗi console.
- [ ] Thử điện thoại thật cả dọc lẫn ngang, và desktop 16:9 ở 3 kích thước chuẩn.
- [ ] Phím mũi tên, Space, con lăn không cuộn trang.

**Trải nghiệm**

- [ ] Vào thẳng gameplay; phần thưởng đầu tiên trong khoảng 10–20 giây.
- [ ] Hướng dẫn ngắn, bằng hình và tay chỉ.
- [ ] ESC pause/resume trên desktop; gợi ý điều khiển đúng thiết bị.
- [ ] Không có UI ở vùng nút Poki (góc trên trái trên mobile).
- [ ] Vòng chơi khoảng 3 phút; nội dung khoảng 1 giờ; sim cân bằng đạt mốc trong thiết kế.

**Quảng cáo và kinh tế**

- [ ] Một loại tiền; không IAP; không cooldown quảng cáo tự đặt.
- [ ] Mọi nút thưởng: không xanh lá, có 🎬, nút thường to bằng và ở trên hoặc bên cạnh.

**Nội dung và trang game**

- [ ] Không nội dung cấm, không IP người khác, mọi asset tự làm hoặc có giấy phép (ghi trong `ASSETS.md`).
- [ ] Thumbnail tĩnh ≥ 628 px, không chữ, không gần `#83FFE7`.
- [ ] Tên, 4 thể loại, mô tả, hướng màn hình đã điền trong P4D.

**Sau khi upload**

- [ ] Playtest ≥ 10 video và xem hết; sửa chỗ người chơi kẹt.
- [ ] Player Fit Test: trung bình > 3 phút và ≥ 25% lượt > 3 phút (mục tiêu thật là ≥ 5 phút).
- [ ] Trước Web Fit Test: C2P dự kiến ≥ 65%, có kế hoạch animated thumbnail cho soft release.

## 12. Bộ khung chung đã làm sẵn

| Việc | Ở đâu |
| --- | --- |
| Adapter Poki (init không chặn, `gameLoadingFinished`, start/stop, `commercialBreak`, `rewardedBreak`, chặn cuộn trang) | `core/platform/poki.ts` |
| Chống gửi start/stop trùng | `core/pause.ts` (`GameplayTracker`) |
| Dừng game và tắt tiếng khi quảng cáo chạy | `core/ads.ts` + `core/pause.ts` |
| `localStorage` trong try/catch | `core/storage.ts` |
| Build theo target (`--mode poki` chèn SDK vào `<head>`) | `vite.config.ts`, `tools/bun-build.mjs` |
| Kiểm dung lượng và URL ngoài | `scripts/check-build.mjs` |
| Debug chỉ có ở bản web | `core/app.ts` |
| `maxTextures` theo game | `core/app.ts` (GameConfig) |

Việc game tự làm, vì phụ thuộc thiết kế từng game:

- Gửi `gameplayStart` ở lần chạm đầu; `stop` và `commercialBreak` khi mở và đóng menu.
- Thứ tự nút thưởng; ESC pause.
- Thumbnail.

Ở Pond Pals, phần này nằm trong `src/scenes/PlayScene.ts` (`startPlay` / `stopPlay` / `resumePlay`) và `tools/art/thumbnail.ts`. Game mới nên sao chép cách làm này.

## 13. Kiểm tra Pond Pals theo hướng dẫn này (15/10/2026)

| Quy định | Trước | Sau khi sửa |
| --- | --- | --- |
| `gameplayStart` ở lần chạm đầu, không phải lúc tải | Gửi lúc vào scene | Gửi ở lần chạm đầu. Đã kiểm bằng SDK giả: `gameLoadingFinished > gameplayStart` |
| `gameplayStop` khi mở menu; `commercialBreak` khi quay lại chơi | Chỉ có break khi đóng Sổ cá | Mọi menu, pause, kết quả boss, chuyển hồ: `stop → commercialBreak → start`, không trùng |
| Không tự đặt bộ đếm quảng cáo | Midgame cách nhau 180 giây, trứng bí ẩn 15 phút, mồi vàng 10 phút | Bỏ hết. Ưu đãi chỉ hiện theo trạng thái (mồi vàng khi chưa bật, trứng khi lò còn chỗ) |
| Nút thưởng không xanh lá, có 🎬 | Xanh lá, huy hiệu nhỏ | Tím, biểu tượng clapperboard trên mọi nút thưởng |
| Nút thường ở trên, to bằng nút thưởng | "Collect x2" và "Keep reeling" nằm trên | Đổi lại: "Collect" / "Try again" / "Keep fishing" nằm trên, cùng cỡ |
| Không thông báo chặn quảng cáo tự chế | Có câu "Ads are blocked…" | Bỏ; quảng cáo lỗi thì im lặng, không thưởng |
| Một loại tiền | Xu + đá quý | Chỉ còn xu (ô lò ấp, ô thú, nhiệm vụ, quà ngày, boss đều tính bằng xu) |
| ESC pause | Không có | ESC mở bảng Paused (Resume, âm thanh), gửi đúng sự kiện |
| Gợi ý điều khiển theo thiết bị | Một câu chung | Desktop: "Hold click or SPACE"; điện thoại: "Hold & release" |
| Hướng dẫn ít chữ | Câu dài | Câu 3–6 chữ, tay chỉ làm mẫu |
| Không đè lên nút Poki | Nút bên trái bắt đầu ở 180 | Dời xuống 250 (đơn vị thiết kế), dưới vùng nút Poki |
| Build sạch | Preset dev và debug còn trong code bản Poki | Preset dev tách file riêng chỉ có ở bản web; `?debug` chỉ bản web |
| Thumbnail tĩnh | Chưa có | `store/thumbnail_1024.png` và `_628.png`: không chữ, nền hoàng hôn ấm (xa `#83FFE7`), mèo + cá vàng nhảy |
| Dung lượng ≤ 5/8 MB, không URL ngoài | 2,1 MB | Giữ nguyên, kiểm lại OK |
| Màn dọc + desktop 16:9, ẩn danh, chặn cuộn, không IAP/chat/link | Đạt | Đạt |
| Vòng chơi khoảng 3 phút, nội dung khoảng 1 giờ | Hồ 2 mở ở khoảng 12–19 phút | Sim sau khi đổi tiền tệ: hồ 2 khoảng 16 phút, boss 2 khoảng 20 phút. Còn thiếu so với mốc 1 giờ, cần hồ 3 (Frozen Lake) trước khi nộp |

**Chưa làm, cần trước các mốc sau:**

- Thử trên điện thoại thật và trong Inspector.
- Thumbnail động `.mp4` (trước Global).
- Bản dịch EFIGS + Thổ Nhĩ Kỳ (khuyến nghị, game có khá nhiều chữ).
- `PokiSDK.measure` cho phễu (tùy chọn).
- Ghi công dùng AI trong mô tả nếu Poki hỏi.

---

## Nguồn

- [Working with Poki](https://developers.poki.com/guide/working-with-poki)
- [What we look for](https://developers.poki.com/guide/what-we-look-for)
- [Poki for Developers platform](https://developers.poki.com/guide/p4d-platform)
- [Inspector](https://developers.poki.com/guide/inspector)
- [Requirements & quality](https://developers.poki.com/guide/requirements-quality)
- [Content & player safety](https://developers.poki.com/guide/content-player-safety)
- [External resources policy](https://developers.poki.com/guide/external-resources-policy)
- [Web game engines](https://developers.poki.com/guide/web-engine)
- [Easy access](https://developers.poki.com/guide/easy-access)
- [Engagement](https://developers.poki.com/guide/engagement)
- [Localization](https://developers.poki.com/guide/localization)
- [Game thumbnail](https://developers.poki.com/guide/game-thumbnail)
- [Your game page](https://developers.poki.com/guide/your-game-page)
- [How testing works](https://developers.poki.com/guide/how-testing-works)
- [Adding your game](https://developers.poki.com/guide/adding-your-game)
- [Playtesting](https://developers.poki.com/guide/playtesting)
- [Player fit test](https://developers.poki.com/guide/player-fit-test)
- [Web fit test](https://developers.poki.com/guide/web-fit-test)
- [Interpreting your test results](https://developers.poki.com/guide/reading-results)
- [How monetization works](https://developers.poki.com/guide/how-monetization-works)
- [Monetization](https://developers.poki.com/guide/monetization)
- [SDK overview](https://developers.poki.com/guide/sdk-overview)
- [Game events / measure](https://developers.poki.com/guide/game-events)
- [SDK HTML5](https://developers.poki.com/guide/sdk-html5)
- [SDK Phaser](https://developers.poki.com/guide/sdk-phaser)
- [Accounts](https://developers.poki.com/guide/accounts)
- [Revenue & deal types](https://developers.poki.com/guide/revenue-deal-types)
- [Final review](https://developers.poki.com/guide/final-review)
- [Release process](https://developers.poki.com/guide/release-process)
- [Post-release updates](https://developers.poki.com/guide/post-release-updates)

Trang Player device report chưa đọc được: số liệu trên trang tải bằng JavaScript nên không lấy ra được.
