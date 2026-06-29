# 🎯 Telegram Bot - Role-Based Interface

**Yangilangan:** 2026-06-29  
**Versiya:** 2.0 - Role-based buttons

## ✅ Yangi Xususiyat: Role-Based Buttons

Har bir foydalanuvchi o'z **roliga mos** buttonlarni ko'radi!

---

## 📱 Rol bo'yicha Interfeys

### 1️⃣ TIKUVCHI (SEAMSTRESS)

**Ko'radigan buttonlar:**
```
┌────────────────────────┐
│  👩‍🏭 Mening ishim      │
├────────────────────────┤
│  📊 Bugungi hisobot    │
└────────────────────────┘
```

**Funksiyalar:**
- ✅ O'z ishlarini ko'rish (bugun, shu oy, umumiy)
- ✅ Bugungi umumiy hisobot

---

### 2️⃣ MENEJER (MANAGER)

**Ko'radigan buttonlar:**
```
┌────────────────────────────────────┐
│  📊 Bugungi hisobot │ 📈 Statistika │
├────────────────────────────────────┤
│  📦 Ochiq ishlar    │ 👥 Tikuvchilar │
├────────────────────────────────────┤
│  💰 Oylik maoshlar  │ ⚠️ Qarzlar     │
└────────────────────────────────────┘
```

**Funksiyalar:**
- ✅ Kunlik hisobotlar
- ✅ Umumiy statistika
- ✅ Ochiq ishlarni boshqarish
- ✅ Tikuvchilar ro'yxati
- ✅ Oylik maoshlar
- ✅ Qarzlar

---

### 3️⃣ ISH BERUVCHI (ISH_BERUVCHI)

**Ko'radigan buttonlar:**
```
┌────────────────────────────────────┐
│  📊 Mening ishlarim │ 💰 Moliyaviy  │
└────────────────────────────────────┘
```

**Funksiyalar:**
- ✅ O'z yuborgan ishlarni ko'rish
- ✅ Moliyaviy hisobot (olindi, to'landi, qarz)
- ✅ So'nggi operatsiyalar

---

### 4️⃣ ADMINISTRATOR (ADMIN)

**Ko'radigan buttonlar (Hammasi):**
```
┌─────────────────────────────────────┐
│  📊 Bugungi hisobot │ 📈 Statistika  │
├─────────────────────────────────────┤
│  ⚠️ Qarzlar        │ 📦 Ochiq ishlar │
├─────────────────────────────────────┤
│  👥 Tikuvchilar     │ 💰 Oylik maoshlar│
├─────────────────────────────────────┤
│  🏭 Ish beruvchilar │ 👩‍🏭 Tikuvchi stats│
└─────────────────────────────────────┘
```

**Funksiyalar (BARCHA):**
- ✅ Kunlik hisobotlar
- ✅ Umumiy statistika
- ✅ Qarzlar
- ✅ Ochiq ishlar
- ✅ Tikuvchilar ro'yxati
- ✅ Oylik maoshlar
- ✅ Ish beruvchilar ro'yxati
- ✅ Barcha tikuvchilar statistikasi

---

## 🆕 Yangi Funksiyalar

### 📊 Tikuvchi Statistikasi (Admin uchun)
Barcha tikuvchilarning ish statistikasi:
- Har bir tikuvchining bugungi ishi
- Har bir tikuvchining oylik ishi
- Umumiy jami summa

### 📦 Ish Beruvchi Ishlari
Ish beruvchi o'z yuborgan ishlarni ko'radi:
- Ish nomi
- Miqdor va summa
- Status (✅ tasdiqlangan / ❌ rad etilgan / ⏳ kutilmoqda)
- Sana

### 💰 Ish Beruvchi Moliyaviy
Ish beruvchining moliyaviy hisoboti:
- Jami olindi summa
- Jami to'landi summa
- Qolgan qarz
- So'nggi 5 ta operatsiya

---

## 🔐 Xavfsizlik va Rol Tekshiruvi

### Avtomatik Rol Aniqlash
```typescript
async function getUserProfile(chatId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, telegram_chat_id")
    .eq("telegram_chat_id", chatId)
    .single();
  return profile;
}
```

### Rol bo'yicha Menyu
```typescript
function getMenuKeyboard(role?: string) {
  if (role === "SEAMSTRESS") {
    // Faqat 2 ta button
  } else if (role === "MANAGER") {
    // 6 ta button
  } else if (role === "ISH_BERUVCHI") {
    // 2 ta button
  } else {
    // Admin - barcha buttonlar
  }
}
```

### Welcome Message
Foydalanuvchi `/start` yuborilganda:
```
🏭 SFA Tailoring Bot

Xush kelibsiz, Malika Tursunova!

Sizning rolingingiz: Tikuvchi

Quyidagi bo'limlardan birini tanlang:
```

---

## 💡 Qanday Ishlaydi?

### Birinchi Marta Kirish

1. **Admin user yaratadi** va Telegram Chat ID ni qo'shadi
2. **Foydalanuvchi** @sfatailoring_bot ga `/start` yuboradi
3. **Bot** chat ID bo'yicha foydalanuvchini topadi
4. **Rol aniqlanadi** va tegishli buttonlar ko'rsatiladi
5. **Foydalanuvchi** faqat o'ziga ruxsat berilgan funksiyalarni ko'radi

### Chat ID Topilmasa

Agar chat ID tizimda bo'lmasa:
```
🏭 SFA Tailoring Bot

Xush kelibsiz!

⚠️ Sizning akkauntingiz tizimga ulanmagan.
Chat ID: 123456789

Quyidagi bo'limlardan birini tanlang:
```

Admin funksiyalariga kirish imkoniyati beriladi (default).

---

## 🎨 Interfeys Xususiyatlari

### ✅ Yaxshi Tomonlari
- Har bir rol faqat kerakli funksiyalarni ko'radi
- Ortiqcha buttonlar yo'q - oddiy va tushunarli
- Rol avtomatik aniqlanadi
- Welcome message shaxsiy (ism va rol bilan)

### 🔄 Navigatsiya
- Har bir javob ostida "⬅️ Asosiy menyu" tugmasi
- Menyu har doim rolga mos
- Message editlanadi (spam bo'lmaydi)

---

## 📋 Rol Permissionlari

| Funksiya | SEAMSTRESS | MANAGER | ISH_BERUVCHI | ADMIN |
|----------|------------|---------|--------------|-------|
| Mening ishim | ✅ | ❌ | ❌ | ❌ |
| Bugungi hisobot | ✅ | ✅ | ❌ | ✅ |
| Statistika | ❌ | ✅ | ❌ | ✅ |
| Qarzlar | ❌ | ✅ | ❌ | ✅ |
| Ochiq ishlar | ❌ | ✅ | ❌ | ✅ |
| Tikuvchilar | ❌ | ✅ | ❌ | ✅ |
| Oylik maoshlar | ❌ | ✅ | ❌ | ✅ |
| Ish beruvchilar | ❌ | ❌ | ❌ | ✅ |
| Tikuvchi stats | ❌ | ❌ | ❌ | ✅ |
| IB Ishlarim | ❌ | ❌ | ✅ | ❌ |
| IB Moliyaviy | ❌ | ❌ | ✅ | ❌ |

---

## 🚀 Deploy

```bash
# Edge function deploy
supabase functions deploy telegram-webhook

# Webhook setup
# (Telegram Settings sahifasida tugma bilan)
```

---

## ✨ Foydalanish Misollar

### Tikuvchi - Malika
1. `/start` yuboradi
2. "Xush kelibsiz, Malika Tursunova! Rolingingiz: Tikuvchi"
3. 2 ta button ko'radi: "Mening ishim" va "Bugungi hisobot"
4. "Mening ishim" ni bosadi
5. O'z ish statistikasini ko'radi
6. "Asosiy menyu" orqali qaytadi

### Manager - Sardor
1. `/start` yuboradi
2. 6 ta button ko'radi
3. "Tikuvchilar" ni bosadi
4. Barcha tikuvchilar ro'yxatini ko'radi
5. "Oylik maoshlar" ga o'tadi
6. Oylik ma'lumotlarni ko'radi

### Ish Beruvchi - Aziza Textile
1. `/start` yuboradi
2. 2 ta button: "Mening ishlarim" va "Moliyaviy"
3. "Mening ishlarim" ni bosadi
4. O'zi yuborgan ishlarni ko'radi
5. "Moliyaviy" ga o'tadi
6. Qarz va to'lovlarni ko'radi

### Admin - Javohir
1. `/start` yuboradi
2. 8 ta button (barcha funksiyalar)
3. Istalgan bo'limga kirishi mumkin
4. "Tikuvchi statistika" ni bosadi
5. Barcha tikuvchilarning ishini ko'radi

---

## 🎯 Kelajakdagi Yaxshilanishlar

- [ ] Dynamic permissions (database dan)
- [ ] Custom role yaratish
- [ ] Role-based notifications
- [ ] Multi-language per role
- [ ] Advanced filters per role

---

**Implementation:** ✅ COMPLETE  
**Testing:** Ready  
**Deploy:** Ready  

Bot endi har bir foydalanuvchiga maxsus interfeys bilan ishlaydi! 🎉
