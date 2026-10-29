# Game #3 — Kitty Pond: Hatch & Fish — Tài liệu thiết kế

(Tên cũ: Pond Pals: Hatch & Fish, đổi ở v1.13.)

Ngày: 14/10/2026 · Bản gốc có thể chỉnh sửa: https://claude.ai/code/artifact/d79f1125-36b4-4d20-b33d-45a465f2efa8

## Tổng quan & định vị

Kitty Pond là game câu cá thư giãn một chạm. Mỗi lần câu có thể ra trứng, ấp thành thú cưng, và thú cưng giúp câu tốt hơn. Game ghép hai ngách cầu cao, cung thấp: câu cá (27 game trên CrazyGames) và thú cưng (12 game).

| Hạng mục | Quyết định |
| --- | --- |
| Thể loại | Casual câu cá + sưu tầm, idle nhẹ |
| Người chơi mục tiêu | 10–35 tuổi, thị trường Tier 1, hay chơi khi đang nghe nhạc hoặc xem video |
| Độ dài phiên | 11–20 phút, chơi lại nhiều lần mỗi ngày |
| Nền tảng | Poki (đường A, độc quyền trên web, chọn 14/10); màn dọc là chính, vẫn chạy ngang trên desktop |
| Điều khiển | Một ngón hoặc chuột: giữ để thả, chạm để giật, giữ–nhả để kéo |
| Phong cách | Cozy pastel, không meme, không cơ chế "steal" |

Ba trụ cột thiết kế:

1. **Vui trong 10 giây.** Con cá đầu tiên lên trước khi có bất kỳ dòng hướng dẫn nào.
2. **Luôn có thứ đang chờ.** Lúc nào cũng có một quả trứng đang ấp, kéo người chơi câu thêm vài lần.
3. **Chơi được khi xao nhãng.** Thú cưng câu hộ khi người chơi rời tay, nên bỏ dở giữa chừng vẫn có tiến trình.

## Vòng chơi

Vòng 30 giây: **Thả, cắn, kéo → Vật bắt được → Bán cá lấy xu → Nâng cấp → câu khỏe hơn** (quay lại Thả).

Vòng trứng: **Vật bắt được → (trứng) Lò ấp trứng → (nở) Thú cưng**. Thú cưng trao perk (luck, giá bán, lực kéo) cho mỗi lần câu và câu hộ, kể cả khi offline.

Vòng meta 15 phút: **Bán cá → (loài mới) Sổ cá → (đủ 6/8) Boss của hồ → (thắng) Mở hồ mới**, giá cá ×3.

## Cơ chế câu cá

Một lần câu gồm ba nhịp, tổng cộng 5–12 giây, cả ba đều chỉ cần một ngón.

1. **Thả câu (giữ rồi nhả).** Thanh lực chạy lên xuống; nhả càng cao thì mồi rơi càng xa.
    - Gần: luck ×1 · Giữa: luck ×1,5 · Xa: luck ×2,5.
    - Chỗ ở của cá (v1.16, 29/10): mỗi loài thích một vùng (Gần, Xa hoặc Siêu xa; `FishDef.zone`). Ném đúng vùng thì loài đó cắn nhiều gấp 2,5 lần các loài cùng độ hiếm (`HABITAT_MULT`); tỉ lệ từng độ hiếm giữ nguyên nên xu không đổi. Cá hôm nay ra ×1,5 trong vùng của nó, ×0,75 ở vùng khác. Cá Huyền thoại không bao giờ cắn ngẫu nhiên (v1.16, 29/10, theo yêu cầu người dùng): khi lần ném lẽ ra ra Huyền thoại, lần đó ra cá khác, còn con Huyền thoại hiện lên trong vùng của nó 15 giây (có đồng hồ đếm; đồng hồ dừng khi đang có cá trên dây và khi mở menu). Ném lưỡi câu cách nó trong 120 đơn vị thì nó cắn; tuột thì nó quay lại nước trong thời gian còn lại; hết giờ thì bơi đi (`LEGEND`, `legendHere` / `tickLegend` trong `src/logic/game.ts`). Luck vẫn quyết định bao lâu nó xuất hiện (mô phỏng: khoảng 5–6 lần mỗi giờ, người mới bắt 3, người giỏi 6). Mỗi độ hiếm có cá ở nhiều vùng. Cá và bóng cá chưa bắt bơi trong vùng của chúng; Sổ cá ghi "Bites: Near / Far / Super far" sau khi bắt được. Không thêm nút hay bước chọn: dùng độ xa của cú ném có sẵn.
2. **Cắn câu (chạm đúng lúc).** Phao nhấp giả 1–3 lần, lần thật thì chìm hẳn.
    - Cửa sổ chạm 0,6 giây, nâng tối đa 0,9 giây nhờ cần câu và thú cưng.
    - Chạm sớm hoặc trễ: cá thoát, không mất gì, thả lại ngay.
3. **Kéo dây (giữ để kéo, nhả khi cá giật).** Thanh căng dây có vùng xanh ở giữa.
    - Giữ: căng tăng và cá lại gần. Nhả: căng giảm.
    - Nằm trong vùng đỏ quá 1 giây thì đứt dây.
    - Cá càng hiếm thì giật càng mạnh và vùng xanh càng hẹp.

**Vật bắt được** (tỉ lệ gốc, trước luck):

| Vật | Tỉ lệ | Kết quả |
| --- | --- | --- |
| Cá | 70% | Bán lấy xu, ghi vào Sổ cá |
| Trứng | 15% | Vào lò ấp; lò đầy thì đổi thành xu |
| Rác vui (ủng, lon) | 10% | Bán 1 xu, kèm câu thoại hài |
| Rương báu | 5% | Xu, đá quý hoặc vật trang trí hồ |

**Độ hiếm của cá và trứng:** Thường 60% · Khá 25% · Hiếm 10% · Sử thi 4% · Huyền thoại 1%. Mỗi 1% luck chuyển 1 điểm tỉ lệ từ bậc Thường sang các bậc trên, chia đều theo tỉ lệ của chúng.

**Boss.** Mỗi hồ có một boss, xuất hiện khi Sổ cá đủ 6/7/8 loài. Trận boss là một lần kéo dài 25–40 giây: boss giật theo nhịp, có cảnh báo "LET GO!" trước mỗi cú giật; giữ dây lúc giật thì dây mòn dần.
- Bấm giữ trong lúc boss đang cảnh báo (sau 0,25 giây phản xạ) thì boss hồi máu, tối đa một lần mỗi cảnh báo: boss đầu (Cozy Pond) hồi 10%, các boss sau và trận đấu lại hồi 25%.
- Thua thì phải câu thêm 5/8/10 con trong hồ để dụ boss quay lại, hoặc xem quảng cáo để kéo tiếp.

**Đấu lại boss (cuối game).** Mỗi boss có 10 sao, mỗi ngày 3 vé thắng. Sao càng cao boss kéo càng mạnh, thưởng xu và trứng càng lớn. Từ ★2, boss xuất hiện ở các **dạng** khác nhau để mỗi trận chơi khác đi:

| Dạng | Nhìn | Khác ở trận đấu |
| --- | --- | --- |
| Thường (★1) | Như boss gốc | Không |
| Cuồng nộ (Frenzy) | Đỏ, nhe răng | Cú giật nhỏ hơn nhưng dồn dập; bấm sai chỉ hồi 40% mức thường |
| Ma (Ghost) | Xanh bạc hà, trong suốt, phát sáng | Vùng xanh trôi lên xuống, phải bám theo |
| Khổng lồ (Giant) | Màu đá rêu, to hơn | Kéo lâu gần gấp đôi, dây bền hơn |
| Vàng (Golden; ★10 luôn là dạng này) | Vàng, đội vương miện | Khó hơn một chút, thưởng xu ×1,5 |

★2–9 xoay vòng 4 dạng, lệch nhau giữa 3 hồ nên cùng một sao thì ba boss mang ba dạng khác nhau. Tỉ lệ thắng của từng dạng được cân bằng gần bằng dạng thường bằng `tools/formtune.ts`.

**Tự câu** mở khóa ở hồ thứ 2. Bật lên thì game tự thả và kéo với hiệu suất 50% so với câu tay, hợp với người vừa chơi vừa xem video.

## Trứng và thú cưng

Trứng biến sự may rủi của mỗi lần câu thành mục tiêu dài hơi. Mỗi thú cưng nở ra làm vòng câu mạnh hơn, nên sưu tầm có ích chứ không chỉ để ngắm.

**Ấp trứng**

- Lò ấp bắt đầu 1 ô, nâng tối đa 4 ô.
- Thời gian ấp: Thường 30 giây · Khá 2 phút · Hiếm 5 phút · Sử thi 10 phút · Huyền thoại 20 phút.
- Mỗi con cá câu được rút 5 giây cho mọi trứng đang ấp, nên câu tay vẫn là cách nở nhanh nhất.
- Xem quảng cáo có thưởng: nở ngay một trứng.
- Độ hiếm của thú bằng độ hiếm của trứng. Trứng hồ 1 nở thú hồ 1. Từ v1.16 (29/10): trứng câu ở hồ 2 có 30% chứa thú hồ 1; trứng câu ở hồ 3 có 10% chứa thú hồ 1 và 20% thú hồ 2, để thú hồ cũ vẫn lên cấp và thú hiếm đã lỡ vẫn kiếm được. Hồ của trứng quyết định lúc câu được (`EGG_POND_MIX`, `eggPond` trong `src/logic/rules.ts`); thú hồ cũ đã cấp 20 thì trứng chứa thú của hồ đang câu. Trứng có dấu hồ ở góc (lá súng / giọt sương / bông tuyết), dấu này cũng đứng cạnh tên hồ trong bảng Pets. Trứng từ nhiệm vụ, quà ngày, cá hôm nay, boss và quảng cáo vẫn là thú của hồ đang câu.
- 1% cơ hội nở bản "lấp lánh" (đổi màu, không tăng chỉ số) để người chơi khoe.

**Thú cưng mang theo**

- 3 ô lúc đầu; ô thứ 4 mở ở hồ thứ 3, ô thứ 5 mua bằng đá quý.
- Mỗi thú có một perk; giá trị tăng theo độ hiếm. Từ v1.16 khoảng cách giữa các độ hiếm hẹp lại để thú ấp sớm không bị bỏ quá nhanh.
- Thú trùng không merge (ngách merge đã bão hòa) mà thành "thức ăn": lên cấp tối đa 5, mỗi cấp +20% perk.
- Thú mang theo bơi hoặc chạy quanh hồ, phản ứng khi có cá cắn: đây là khoảnh khắc dễ thương người chơi hay chụp màn hình.

| Perk | Tác dụng | Thường | Huyền thoại |
| --- | --- | --- | --- |
| May mắn | Tăng luck | +3% | +10% |
| Thương nhân | Tăng giá bán cá | +11% | +36% |
| Lực sĩ | Kéo dây nhanh hơn | +10% | +32% |
| Tinh mắt | Cửa sổ chạm dài hơn | +0,08 giây | +0,27 giây |
| Thợ câu | Câu hộ, kể cả khi offline | 1,4 cá / phút | 4,6 cá / phút |
| Ấp ủ | Ấp trứng nhanh hơn | +11% | +36% |
| Tìm trứng (v1.16) | Trứng cắn câu nhiều hơn (trọng số trứng ×(1 + v)) | +6% | +19% |
| Mũi săn kho báu (v1.16) | Rương cắn câu nhiều hơn (trọng số rương ×(1 + v)) | +15% | +48% |
| Cá to (v1.16) | Cá to hơn (kích cỡ ×(1 + v)): thêm xu, kỷ lục, cá khổng lồ | +3% | +9,5% |

Giá trị ở cấp 1, theo `PERKS` trong `src/content/data.ts` (v1.16, 29/10). Huyền thoại khoảng 3,2 lần Thường (trước 6–8 lần). Hệ số cấp 20 theo độ hiếm: Thường ×2,8, Khá ×2,6, Hiếm ×2,4, Sử thi ×2,2, Huyền thoại ×2,0 (trước ×2,07 cho mọi độ hiếm). Thường cấp 6 ngang Hiếm cấp 1, cấp 14 ngang Sử thi cấp 1; Huyền thoại cấp 1 vẫn hơn Thường cấp 20. Mỗi hồ 5 thú 5 perk khác nhau, mỗi perk có ở tối đa 2 thú.

## Kinh tế và công thức

Hai loại tiền, không có mua bằng tiền thật trong MVP. Mọi con số dưới đây là điểm xuất phát, sẽ chỉnh lại sau playtest.

- **Xu:** bán cá mà có; dùng để nâng cấp và mở hồ mới.
- **Đá quý:** từ rương, nhiệm vụ ngày, boss và quảng cáo; dùng mở ô thú, ô lò ấp và đồ trang trí hồ.

**Giá bán một con cá**

```
Price = B_rarity × S × P_pond × (1 + M)
```

- B (giá gốc theo độ hiếm): Thường 5 · Khá 12 · Hiếm 30 · Sử thi 80 · Huyền thoại 250 xu.
- S (kích thước): ngẫu nhiên 0,8–1,5, hiển thị bằng cm để người chơi so kỷ lục.
- P (hệ số hồ): hồ 1 ×1, mỗi hồ sau ×3 (×3, ×9, ×27, ×81).
- M: tổng perk Thương nhân của thú đang mang.

**Chi phí nâng cấp**

```
Cost(L) = C0 × 1.15^L
```

| Nâng cấp | Mỗi cấp | C₀ (xu) | Cấp tối đa |
| --- | --- | --- | --- |
| Cần câu | Lực kéo +8% | 20 | 50 |
| Dây câu | Chịu vùng đỏ lâu hơn +0,1 giây | 30 | 20 |
| Mồi | Luck +1% | 40 | 30 |
| Phao | Cửa sổ chạm +0,02 giây | 50 | 10 |

**Mục tiêu nhịp độ** để cân chỉnh: có một nâng cấp mua được sau mỗi 1–3 phút chơi; giá mở hồ kế tiếp bằng khoảng 15 phút thu nhập ở hồ hiện tại.

**Offline:** thú Thợ câu tiếp tục câu, tích tối đa 2 giờ (nâng lên 8 giờ bằng đá quý). Khi quay lại, xem quảng cáo để nhân đôi phần thu offline.

## Nội dung

Bản đầy đủ có 5 hồ, mỗi hồ 8 loài cá, 5 thú cưng và 1 boss; MVP chỉ làm 2 hồ đầu. Tên trong game dùng tiếng Anh vì thị trường chính là Tier 1.

**Quy tắc boss:** boss xuất hiện khi đã ghi 6/8 loài cá của hồ. Trận kéo dài 20–30 giây, 3 pha giật đổi nhịp. Thắng thì được một trứng Sử thi và quyền mở hồ kế (vẫn cần trả xu).

| Hồ | Chủ đề | Boss | Phạm vi |
| --- | --- | --- | --- |
| 1. Cozy Pond | Ao làng, hoa súng, nắng sáng | Old Whiskers (cá trê khổng lồ) | MVP |
| 2. Misty Creek | Suối rừng, sương sớm, đom đóm | The Fog Pike | MVP |
| 3. Coral Cove | Vịnh san hô nhiệt đới | Captain Clawford (cua đỏ) | Bản 1.2 |
| 4. Frozen Lake | Hồ băng, câu qua lỗ băng | Krampus Cod | Bản 1.1 (Giáng sinh) |
| 5. Moonlit Lagoon | Đầm đêm, cá phát sáng | The Moon Leviathan | Bản 1.3 |

**Cá của 2 hồ MVP**

| Độ hiếm | Cozy Pond | Misty Creek |
| --- | --- | --- |
| Thường | Pebble Minnow | Fog Shiner |
| Thường | Lily Carp | Stone Loach |
| Thường | Mud Guppy | Willow Dace |
| Khá | Bubble Perch | Mist Salmon |
| Khá | Clover Trout | Rainbow Grayling |
| Hiếm | Teacup Koi | Ghost Pike |
| Sử thi | Lantern Catfish | Thunder Sturgeon |
| Huyền thoại | Golden Duckfish | Silver Spirit Trout |

**Thú cưng của 2 hồ MVP**

| Độ hiếm | Cozy Pond | Misty Creek |
| --- | --- | --- |
| Thường | Puddle Frog · May mắn | Mossy Snail · Lực sĩ |
| Khá | Reed Duckling · Thương nhân | Creek Beaver · Thợ câu |
| Hiếm | Otter Pup · Thợ câu | Firefly Fox · May mắn |
| Sử thi | Lily Turtle · Ấp ủ | Heron Chick · Tinh mắt |
| Huyền thoại | Sunny Axolotl · Tinh mắt | Mist Fawn · Thương nhân |

Mỗi hồ còn có 2–3 món rác vui riêng (ủng cao su, lon soda, xe đạp cũ) để câu nào cũng có bất ngờ.

## Tiến trình và nhịp độ 15 phút đầu

Cứ 30–90 giây người chơi nhận một thứ mới, và hồ thứ hai mở quanh phút 15. Đây là đoạn CrazyGames và Poki dùng để đo playtime khi thử game, nên mọi khoảnh khắc đều được sắp sẵn.

1. **0:00** — Mở thẳng vào hồ, không menu. Ngón tay gợi ý "Giữ để thả".
2. **0:05** — Lần thả đầu chắc chắn có cá cắn sau 2 giây; cửa sổ chạm nới ra 1,2 giây.
3. **0:15** — Cá đầu tiên lên, tự bán, xu bay về góc màn hình.
4. **0:45** — Lần câu thứ 3 chắc chắn ra trứng; lò ấp xuất hiện.
5. **1:15** — Trứng nở ra Puddle Frog, được đặt sẵn vào ô mang theo.
6. **2:00** — Đủ xu cho lần nâng cần câu đầu tiên; nút nâng cấp sáng lên.
7. **3:00** — Hiện 3 nhiệm vụ ngày đầu tiên.
8. **5:00** — Rương báu đầu tiên (có sẵn), cho đá quý.
9. **8:00** — Sổ cá đạt 4/8, hiện bóng boss dưới nước làm mồi nhử.
10. **~12:00** — Đạt 6/8, đấu Old Whiskers.
11. **~15:00** — Mở Misty Creek và chế độ Tự câu.

**Giữ chân người chơi quay lại**

- 3 nhiệm vụ ngày, làm mới lúc 0:00 giờ địa phương.
- Chuỗi đăng nhập 7 ngày; ngày 7 tặng trứng Hiếm.
- "Lần câu may mắn" mỗi ngày: một lần thả với luck ×3.
- Phần thu offline chờ sẵn khi mở lại game.

## UI/UX màn hình dọc

Cả vùng hồ là nút câu: chạm đâu cũng được, nên không cần nhắm. Màn dọc là bố cục gốc vì Poki yêu cầu mọi game chạy được ở chế độ này.

**Bố cục từ trên xuống**

1. Thanh trên: xu, đá quý, nút cài đặt. Lò ấp nổi ở góc phải, hiện đồng hồ đếm ngược.
2. Hồ chiếm khoảng 60% màn hình; thú mang theo bơi hoặc ngồi quanh bờ.
3. Thanh lực và thanh căng dây hiện sát ngón tay, chỉ khi đang dùng.
4. Thanh dưới 4 nút: Nâng cấp · Thú cưng · Sổ cá · Bản đồ hồ.

**Desktop ngang:** hồ ở giữa, 4 bảng nâng cấp/thú/sổ/bản đồ chuyển thành cột bên phải, luôn mở. Phím Space thay cho chạm.

**Nguyên tắc**

- Ít chữ, nhiều biểu tượng, để dịch sang ngôn ngữ khác rẻ.
- Mỗi độ hiếm có cả màu lẫn hình viền riêng, để người mù màu vẫn phân biệt được.
- Cá hiếm lên: màn hình rung nhẹ, chữ "NEW!" và ảnh cá to giữa màn hình trong 1,5 giây.
- Âm thanh: tiếng nước và nhạc lo-fi nhẹ, tắt riêng được từng loại.

## Kiếm tiền

Doanh thu đến từ quảng cáo có thưởng mà người chơi tự chọn xem; quảng cáo xen kẽ chỉ đặt ở chỗ nghỉ tự nhiên. Mọi quảng cáo đi qua SDK của từng nền tảng, không dùng mạng quảng cáo riêng.

| Vị trí có thưởng | Phần thưởng | Giới hạn |
| --- | --- | --- |
| Nở trứng ngay | Trứng đang ấp nở lập tức | Không giới hạn |
| Nhân đôi thu offline | ×2 xu của phiên offline | 1 lần mỗi lần quay lại |
| Trứng bí ẩn | 1 trứng ngẫu nhiên của hồ hiện tại | Mỗi 15 phút |
| Thử lại boss | Tiếp tục kéo khi đứt dây | 1 lần mỗi trận |
| Mồi vàng | Luck ×2 trong 5 phút | Mỗi 10 phút |

**Quảng cáo xen kẽ** chỉ hiện khi chuyển hồ, sau trận boss, hoặc khi đóng Sổ cá. Hai lần cách nhau ít nhất 3 phút, và không bao giờ chen vào lúc đang kéo dây.

**Sau MVP** có thể thêm gói trang trí hồ trả phí, chỉ ở nền tảng nào hỗ trợ mua trong game.

## MVP, lộ trình và KPI

MVP gồm 2 hồ, bắt đầu sau khi nộp game #2. Game đi đường A (Poki, chọn 14/10): trên web chỉ phát hành ở Poki. Mốc kiểm tra khoảng 26/10, khi Poki trả lời game #2: Poki im lặng hoặc từ chối thì chuyển game #3 sang CrazyGames và các portal khác.

**Phạm vi MVP**

- [ ] Ba nhịp câu: thả, cắn, kéo
- [ ] 2 hồ, 16 loài cá, 10 thú cưng, 2 boss
- [ ] Lò ấp, Sổ cá, 4 nâng cấp
- [ ] Nhiệm vụ ngày, chuỗi đăng nhập, thu offline
- [ ] 5 vị trí quảng cáo có thưởng và quảng cáo xen kẽ
- [ ] Tích hợp SDK Poki qua adapter chung của dự án

**Lộ trình** (mốc đề xuất)

| Giai đoạn | Thời gian | Nội dung |
| --- | --- | --- |
| MVP | sau khi nộp game #2 | 2 hồ, 16 cá, 10 thú; boss, nhiệm vụ ngày; SDK Poki |
| Nộp Poki | khoảng giữa tháng 11 | Player Fit Test, Web Fit Test, duyệt; soft rồi global release (1–2 tháng) |
| Frozen Lake | vào bản nộp nếu kịp | Hồ băng, câu qua lỗ băng; thú, trang trí lễ; không cần bản cập nhật riêng |
| Cổng KPI | — | Đạt mục tiêu thì mới làm v1.2 |
| v1.2 – v1.3 | tháng 1–2/2027 | Coral Cove, Moonlit Lagoon; bảng xếp hạng; khoe hồ với bạn bè |

Đường Poki mất 1–2 tháng từ lúc nộp tới global release, nên Frozen Lake đưa vào bản nộp nếu kịp thay vì làm bản cập nhật Giáng sinh riêng.

**KPI khi thử nghiệm** (mục tiêu đề xuất, chỉnh lại theo dữ liệu thật)

| Chỉ số | Mục tiêu |
| --- | --- |
| Người chơi câu được con cá đầu tiên | ≥ 90% |
| Thời gian chơi trung bình mỗi người, ngày đầu | ≥ 10 phút |
| Người chơi mở được hồ 2 | ≥ 35% |
| Quảng cáo có thưởng mỗi người mỗi ngày | ≥ 2 |
| Tỉ lệ quay lại ngày hôm sau | ≥ 15% |

**Yêu cầu kỹ thuật**

- Phaser 4 + TypeScript và bộ khung chung của dự án. Poki cho biết game Unity có tỉ lệ người vào chơi thấp hơn game web-native.
- Tải ban đầu dưới 8 MB (yêu cầu của Poki).
- Báo sự kiện bắt đầu/dừng chơi cho SDK đúng lúc (vào hồ, mở menu).
- Lưu tiến trình cục bộ; dùng lưu đám mây của nền tảng nào có hỗ trợ.
- Không link ra ngoài, không tên thương hiệu của bên thứ ba trong game.

## Nguồn

- [CrazyGames — All Tags](https://www.crazygames.com/tags) (số game theo tag)
- [Poki — What it takes to build web games in 2026](https://poki.com/blog/building-web-browser-games-2026) (màn dọc, Unity)
- [CrazyGames Developer Guide 2026](https://app.cinevva.com/guides/publish-game-crazygames) (giới hạn 50 MB)
| Thử thách từ màn 3 (v1.16, 29/10) | Màn 1–2 giữ nguyên để làm quen. Từ màn 3: cần thêm 1 loài (tối đa 7), thời gian giữ nguyên, và có một đàn của một loài Thường bơi khắp hồ: màn 3–8 lần lượt 7, 9, 10, 12, 13, 15 con (tăng 29/10 từ 3–5 con vì quá ít; mô phỏng thô: màn 3 qua ~92–96%, màn 8 ~61–68% với người ngắm khá) (`decoys`, `decoy` trong `CHALLENGES`). Con gần lưỡi câu nhất cắn, nên ném ẩu dễ ra cá trùng loài; phải ngắm giữa đàn. Bắt một con trong đàn thì con khác của đàn bơi vào thay |
| Thử thách mở theo boss (v1.16, 29/10) | Thử thách của mỗi hồ chỉ mở khi đã bắt được boss của hồ đó lần đầu (`challengeBossDone`), trước đây mở ngay khi mở khóa hồ. Bảng thử thách ghi dòng đỏ "Catch {boss} once to open these challenges" ở tab hồ chưa bắt boss |
| Ô theo dõi loài trong thử thách (v1.16, 29/10) | Ô to hơn (bán kính 31), nền kem viền xanh khi đã bắt; ảnh cá dùng texture nhỏ riêng `fishs:<id>` vẽ đúng cỡ biểu tượng cho nét (thu nhỏ ảnh cá lớn bị mờ/răng cưa) |
| Tầng nước theo vùng ném trên điện thoại dọc (v1.16, 29/10) | Màn hình dọc hẹp nên Gần/Xa/Rất xa gần như trùng chỗ. Ở màn dọc, mỗi vùng còn là một tầng nước: lưỡi câu chìm tới 14%/37%/60% độ sâu, cá ưa vùng nào bơi trong tầng đó (±9%); cá Huyền thoại hiện ở giữa tầng. Màn ngang giữ như cũ (lưỡi 28/48/68%, cá bơi mọi độ sâu). Khi giữ để ném, vùng sẽ rơi vào sáng lên mờ (`Pond.setAim`) ở cả hai hướng màn hình |
| Tiếng trứng nứt (v1.16, 29/10) | Lúc nở: trứng lắc 7 nhịp, nứt 3 lần (vết nứt dài dần, tiếng `crack` mới), rồi vỡ bằng tiếng `hatch` làm lại (tiếng gõ trầm, tiếng tách giòn, chuỗi vỏ vụn, mảnh vỏ, rồi chuông). Hai tiếng làm bằng `make_audio.py eggs`, dùng dòng ngẫu nhiên riêng nên các tiếng khác không đổi |
| Theo dõi loài trong Thử thách (v1.16, 29/10) | Dưới thanh thử thách có một hàng ô, mỗi ô một loài cần bắt; loài bắt được hiện hình trong ô. Cá thuộc loài đã bắt bơi mờ đi trong hồ, để loài còn thiếu nổi bật |
| Chỉ số đồ trong tủ đồ (v1.16, 29/10, `stats` trong `COSMETICS`) | Mỗi món mua được hoặc độc quyền cộng 1–2 chỉ số, mỗi chỉ số 1–3% (luck tính bằng điểm), cộng vào perk của đội: Price (giá cá), Luck, Size (cỡ cá), Reel (lực kéo), Eggs (ra trứng), Hatch (ấp nhanh), Chests (rương). Món càng đắt càng cộng nhiều và cộng chỉ số mạnh hơn (giá cá, luck). Đồ mặc định không cộng. Mặc đủ 4 món đắt nhất: Price +10%, Luck +6%, Reel +3%, Size +3%. Thẻ đồ ghi chỉ số; cuối bảng ghi tổng đang mặc |
| Lưỡi câu chắc (Firm hook, v1.16, 29/10, `FIRM_HOOK`) | Dòng thứ 5 trong bảng Nâng cấp. Trong 5 phút (giờ thật), cá tuột khỏi lưỡi 10% thay vì 20%. Giá = 30% số xu đang có, tối thiểu 100 (chỉ có hồ 1), 500 (đã mở hồ 2), 2.000 (đã mở hồ 3). Đang bật thì không mua chồng; HUD hiện đồng hồ đếm ngược |
