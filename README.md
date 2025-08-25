# 🥗 SmartBites – Allergy & Diet-Aware Recipe Finder

## Supabase Email Template Fix

**In Supabase Dashboard → Authentication → Email Templates → Reset Password:**

Replace this:
```html
<a href="{{ .ConfirmationURL }}" style="background:#FF8866;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;display:inline-block;font-weight:600">
  Reset Password
</a>
```

With this:
```html
<a href="{{ .SiteURL }}/reset-password?token={{ .TokenHash }}&type=recovery" style="background:#FF8866;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;display:inline-block;font-weight:600">
  Reset Password
</a>
```

This will generate: `https://smartbites.food/reset-password?token=...&type=recovery`

SmartBites is a mobile app built with React Native and Expo that helps users discover recipes tailored to their allergies and dietary preferences. Users can save their preferences, browse AI-powered suggestions, and mark recipes as favorites for easy access — all backed by a Supabase-powered backend.

---

## 🚀 Features

- 🔍 **Search allergy-safe & diet-friendly recipes**
- 🧠 **AI-enhanced recipe suggestions**
- 💾 **Save dietary preferences**
- ❤️ **Mark & view favorite recipes**
- 🔐 **User authentication with Supabase**
- 📱 **Cross-platform support (iOS & Android via Expo)**

---

## 🧱 Built With

- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [AppWrite](https://cloud.appwrite.io/)
- [OpenAI API](https://platform.openai.com/)

---

## 📸 Screenshots

| Search                                 | Favorites                                    | Settings                                   |
| -------------------------------------- | -------------------------------------------- | ------------------------------------------ |
| ![Search](./assets/screens/search.png) | ![Favorites](./assets/screens/favorites.png) | ![Settings](./assets/screens/settings.png) |

---

## 📦 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/safeplate.git
cd safeplate
```
