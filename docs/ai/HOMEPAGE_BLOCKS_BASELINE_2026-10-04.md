# Magic Metal — базовый дизайн главной по блокам

**Зафиксировано:** 04.10.2026  
**Базовый commit:** `b13323a09a3a8ea596af9d9ccf0ba83781e60ee3`  
**Production:** https://magicmet.ru

Этот снимок сохраняет предыдущий минимальный дизайн до следующей итерации. Каждый блок можно восстановить отдельно через Git, не откатывая остальные изменения.

| Блок | Компонент / файл | Селектор |
|---|---|---|
| Шапка | `src/components/MagicMetalHome.tsx` | `.minimal-header` |
| Первый экран и hero | `src/components/MagicMetalHome.tsx` | `.minimal-hero` |
| Разделы продукции | `src/components/MagicMetalHome.tsx` | `.minimal-products` |
| Форма заявки | `src/components/RequestForm.tsx` | `.request-form` |
| Контакты возле формы | `src/components/MagicMetalHome.tsx` | `.request-copy` |
| Подвал | `src/components/MagicMetalHome.tsx` | `.minimal-footer` |
| Стили всех блоков | `src/app/(frontend)/home-minimal.css` | одноимённые селекторы |

## Правило следующих изменений

- Сохранять текущую последовательность блоков: hero → продукция → заявка → footer.
- Не добавлять тяжёлые видео, iframe, внешние шрифты и обязательный длинный квиз.
- Менять текст, типографику и CTA по блокам; не переписывать рабочую форму и каталог без отдельной причины.
- Перед production: Preview → desktop/mobile/no-JavaScript → Chromium/Firefox/Lighthouse.

## Восстановление одного блока

Источником предыдущей версии служит commit `b13323a09a3a8ea596af9d9ccf0ba83781e60ee3`. Восстанавливать следует только нужный диапазон JSX/CSS через отдельный PR, сохраняя актуальные исправления формы, безопасности и инфраструктуры.
