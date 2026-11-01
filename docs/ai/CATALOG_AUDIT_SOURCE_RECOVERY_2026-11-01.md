# Восстановление источников аудита каталога — 1 ноября 2026

Checkout: `051c8038771628f7757d7cf9dd56de63b66f1b4f`. Это восстановление исторических отметок и маршрутов из исходников, **не нормативная экспертиза и не live QA**. Код, ассортимент и публичный UI не менялись.

## Источники и расхождение счётчиков

Ранее отсутствовавшие материалы восстановлены из вложений проекта; точные копии сохранены в [sources/catalog-audit-2026-10-30](sources/catalog-audit-2026-10-30):

- `SITE1_FULL_CATALOG_AUDIT_2026-10-30.md`: снимок `2220fec`, 56 строк; 18 явных отметок «ТРЕБУЕТ ПРОРАБОТКИ», остальные 38 — «Проверить НД/сортамент».
- `SITE1_FULL_CATALOG_AUDIT_2026-10-30.json`: другой снимок `8367ff6`, 10 групп / 56 строк / 39 карточек; `weakRows=20`, 20 сокращённых выдержек `weakRowsByName`, `placeholderRows=0`.

Схема JSON: `commit`, `groups`, `homepageRows`, `detailCards`, `weakRows`, `placeholderRows`, `weakRowsByName`, `detailByCategory`, `date`. Файл не содержит полного построчного каталога и критериев классификации слабости; выдержки местами обрезаны.

Число **25** из handoff не воспроизведено ни одним файлом. Нельзя объединять 18 и 20 в вымышленный «исходный список 25». Разные исторические снимки сохраняются раздельно. `placeholderRows=0` — исторический результат классификации, не доказательство сегодняшней полноты или правильности данных.

## Сопоставление с текущим каталогом

В текущем `public/home-static.html` подсчитаны 11 групп / 59 строк; в `src/data/productDetailCatalog.ts` — 42 записи. Все 56 прежних названий сопоставлены; «Канаты» переименованы в «Канаты стальные». Добавлены три строки рельсов. Разница числа строк и карточек сама по себе не означает отсутствующие страницы: используются также категории, специализированные маршруты и форма заявки.

«Да» ниже — только историческая отметка соответствующего источника; «—» не означает нормативное одобрение. URL извлечены из текущего статического HTML. HTTP, поиск, реальный `GET /`, полнота карточек и правильность характеристик здесь не проверялись.

| № | Текущая строка | URL из исходника | MD: требует проработки | JSON: слабая формулировка |
|---:|---|---|---|---|
| 1 | Электросварные прямошовные и спиралешовные | `/produkciya/truby-elektrosvarnye` | — | — |
| 2 | Водогазопроводные | `/produkciya/truby-elektrosvarnye/vodogazoprovodnye#sizes` | — | — |
| 3 | Профильные квадратные и прямоугольные | `/produkciya/truby-elektrosvarnye/profilnye#sizes` | — | — |
| 4 | Бесшовные горячедеформированные | `/produkciya/truby-besshovnye/goryachedeformirovannye#sizes` | — | — |
| 5 | Бесшовные холоднодеформированные | `/produkciya/truby-besshovnye/holodnodeformirovannye#sizes` | — | — |
| 6 | Котельные и крекинговые | `/produkciya/truby-besshovnye/kotelnye#sizes` | — | да |
| 7 | Нержавеющие и коррозионностойкие | `/produkciya/truby-besshovnye/nerzhaveyushchie#sizes` | — | — |
| 8 | Нефтяного сортамента | `/produkciya/truby-besshovnye` | — | — |
| 9 | Отводы бесшовные | `/produkciya/sdt/otvody-besshovnye#sizes` | — | — |
| 10 | Тройники бесшовные | `/produkciya/sdt/troyniki-besshovnye#sizes` | — | — |
| 11 | Переходы бесшовные | `/produkciya/sdt/perekhody-besshovnye#sizes` | — | — |
| 12 | Фланцы | `/produkciya/sdt/flantsy#sizes` | — | — |
| 13 | Заглушки и днища | `/produkciya/sdt/zaglushki-i-dnishcha#sizes` | — | — |
| 14 | Теплоизоляция ППУ | `/produkciya/truby-i-sdt-v-izolyacii/ppu#sizes` | — | — |
| 15 | Экструдированный полиэтилен (ВУС) | `/produkciya/truby-i-sdt-v-izolyacii/vus#sizes` | — | — |
| 16 | Эпоксидное покрытие | `/produkciya/truby-i-sdt-v-izolyacii/epoksidnaya#sizes` | — | — |
| 17 | ТУМ-лента | `/produkciya/truby-i-sdt-v-izolyacii/tum-lenta#sizes` | — | — |
| 18 | СДТ в изоляции | `/produkciya/truby-i-sdt-v-izolyacii/sdt-v-izolyacii#sizes` | — | — |
| 19 | Лист г/к | `/produkciya/listovoy-prokat/goryachekatanyj#sizes` | — | — |
| 20 | Лист х/к | `/produkciya/listovoy-prokat/holodnokatanyj#sizes` | — | — |
| 21 | Оцинкованный прокат | `/produkciya/listovoy-prokat/ocinkovannyj#sizes` | — | — |
| 22 | Лист рифлёный | `/produkciya/listovoy-prokat/list-riflenyj` | да | да |
| 23 | Лист ПВЛ | `/produkciya/listovoy-prokat/list-pvl` | да | да |
| 24 | Профнастил | `/produkciya/listovoy-prokat/profnastil` | да | да |
| 25 | Арматура | `/produkciya/sortovoy-i-fasonny-prokat/armatura` | да | да |
| 26 | Катанка | `/produkciya/sortovoy-i-fasonny-prokat/katanka` | да | да |
| 27 | Круг горячекатаный | `/produkciya/sortovoy-i-fasonny-prokat/krug-goryachekatanyj#sizes` | — | — |
| 28 | Квадрат | `/produkciya/sortovoy-i-fasonny-prokat/kvadrat#sizes` | — | — |
| 29 | Шестигранник | `/produkciya/sortovoy-i-fasonny-prokat/shestigrannik` | да | да |
| 30 | Полоса | `/produkciya/sortovoy-i-fasonny-prokat/polosa#sizes` | — | да |
| 31 | Уголок | `/produkciya/sortovoy-i-fasonny-prokat/ugolok#sizes` | — | — |
| 32 | Балка двутавровая | `/produkciya/sortovoy-i-fasonny-prokat/balka-dvutavrovaya#sizes` | — | — |
| 33 | Швеллер | `/produkciya/sortovoy-i-fasonny-prokat/shveller#sizes` | — | да |
| 34 | Швеллер гнутый | `/produkciya/sortovoy-i-fasonny-prokat/shveller-gnutyj` | да | — |
| 35 | Рельсы железнодорожные | `/produkciya/relsy/zheleznodorozhnye#sizes` | — | — |
| 36 | Рельсы узкоколейные | `/produkciya/relsy/promyshlennye#sizes` | — | — |
| 37 | Рельсы крановые | `/produkciya/relsy/kranovye#sizes` | — | — |
| 38 | Нержавеющий лист | `/produkciya/nerzhaveyushchaya-stal/list#sizes` | — | да |
| 39 | Нержавеющие трубы | `/produkciya/nerzhaveyushchaya-stal/truby#sizes` | — | — |
| 40 | Нержавеющий круг и профиль | `/produkciya/nerzhaveyushchaya-stal/sortovoy-prokat#sizes` | — | — |
| 41 | Кольца и диски | `/produkciya/pokovki-i-zagotovki/kolca-i-diski#sizes` | — | — |
| 42 | Валы и оси | `/produkciya/pokovki-i-zagotovki/valy#sizes` | — | — |
| 43 | Поковки по чертежу | `/produkciya/pokovki-i-zagotovki/po-chertezhu#sizes` | — | — |
| 44 | Медь | `/produkciya/cvetnye-metally/med#sizes` | да | да |
| 45 | Латунь | `/produkciya/cvetnye-metally/latun#sizes` | да | да |
| 46 | Бронза | `/produkciya/cvetnye-metally/bronza#sizes` | да | — |
| 47 | Алюминий | `/produkciya/cvetnye-metally/alyuminij#sizes` | да | да |
| 48 | Титан | `/produkciya/cvetnye-metally/titan#sizes` | да | да |
| 49 | Олово | `/produkciya/cvetnye-metally/olovo#sizes` | да | — |
| 50 | Свинец | `/produkciya/cvetnye-metally/svinec#sizes` | да | — |
| 51 | Цинк | `/produkciya/cvetnye-metally/cink#sizes` | да | — |
| 52 | Нихром | `/produkciya/cvetnye-metally/nihrom#sizes` | — | да |
| 53 | Баббит | `/produkciya/cvetnye-metally/babbit#sizes` | — | — |
| 54 | Крепёж | `/produkciya/metizy-i-svarochnye-materialy/krepezh#sizes` | — | да |
| 55 | Канаты стальные | `/produkciya/metizy-i-svarochnye-materialy/kanaty` | да | — |
| 56 | Сетки | `/produkciya/metizy-i-svarochnye-materialy/setki` | да | да |
| 57 | Лента упаковочная | `/produkciya/metizy-i-svarochnye-materialy/lenta-upakovochnaya` | да | да |
| 58 | Проволока и электроды | `/produkciya/metizy-i-svarochnye-materialy/svarochnye-materialy#sizes` | — | да |
| 59 | Оборудование и комплектующие | `/?product=%D0%9E%D0%B1%D0%BE%D1%80%D1%83%D0%B4%D0%BE%D0%B2%D0%B0%D0%BD%D0%B8%D0%B5%20%D0%B8%20%D0%BA%D0%BE%D0%BC%D0%BF%D0%BB%D0%B5%D0%BA%D1%82%D1%83%D1%8E%D1%89%D0%B8%D0%B5#request` | — | да |

## Следующий этап

1. Сохранить исторические отметки, не открывая весь BATCH-005 заново. Поздние уточнения оценивать по текущим данным и доказательствам публикации.
2. Для всех 59 строк отдельно заполнить матрицу: первоисточник → применимость стандарта к форме изделия → размеры и ограничения → марки → техническая проверка → production-доказательство. Наличие URL не закрывает эти графы.
3. Отдельно подтвердить рельсы, ферросплавы и совместимость марок цветных металлов с полуфабрикатами. В историческом аудите нет самостоятельной строки ферросплавов; это не доказывает отсутствие незакоммиченных Windows-данных.
4. Не считать «по спецификации» ошибкой автоматически, особенно для оборудования и изготовления по чертежу. Коммерческие перечни не заменяют нормативные первоисточники.

## Проверка и границы

Проверены схема JSON и уникальность его 20 отметок, 56 Markdown-строк и 18 отметок, 59 текущих строк/11 групп, сопоставление 56/56 прежних названий и 42 записи карточек. Тесты приложения не запускались: изменена только документация. Это промежуточная матрица маршрутов и исторических отметок; полный нормативный аудит остаётся открытым.

SHA-256 исходных вложений:

- `01-SITE1_FULL_CATALOG_AUDIT_2026-10-30.md`: `ff527674db3c1d516e55906a4ffab83385df057fc3e4e9901ac21d0c1d6c4cba`.
- `09-SITE1_FULL_CATALOG_AUDIT_2026-10-30.json`: `89deb97aee33370ad49e03bef96ece721a9ffb140b3c073cf28f659757b1115c`.

Исходные вложения не изменены. Локальное создание документа не доказывает публикацию или запись в Windows/Obsidian.
