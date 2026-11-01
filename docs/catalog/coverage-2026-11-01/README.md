# Матрица покрытия каталога — без отложенного раздела

Источник кода: `74152b7fda437e8fe6d903a5a26fc7e4f9e6f14f`. Канаты исключены по указанию владельца.
Это новый реестр, а не восстановленный аудит 25 строк. Указанные в коде ГОСТы,
марки и диапазоны — **заявления для проверки**, а не нормативное заключение.
Ссылка на внешний источник не подтверждает, что он актуален или применим.

## Объём

- groups: 11
- homeRows: 58
- details: 65
- productDetailCatalog: 41
- pipeCatalog: 16
- sdtCatalog: 8
- unmappedHomeRows: 0
- withSizeSeries: 38
- procurementGuides: 16
- externalSourceCandidates: 55

41 запись productDetailCatalog + 16 трубных + 8 СДТ = 65 подробных URL.
58 строк главной могут вести на карточку, категорию либо сразу в заявку;
эти количества не обязаны совпадать. Fragment/query удалены только для
сопоставления маршрутов; исходные ссылки сохранены в JSON.

## Строки главной

| Группа | Позиция | Маршрут | Тип связи | Карточек в связи |
|---|---|---|---|---:|
| Трубы | Электросварные прямошовные и спиралешовные | /produkciya/truby-elektrosvarnye | category | 5 |
| Трубы | Водогазопроводные | /produkciya/truby-elektrosvarnye/vodogazoprovodnye | detail | 1 |
| Трубы | Профильные квадратные и прямоугольные | /produkciya/truby-elektrosvarnye/profilnye | detail | 1 |
| Трубы | Бесшовные горячедеформированные | /produkciya/truby-besshovnye/goryachedeformirovannye | detail | 1 |
| Трубы | Бесшовные холоднодеформированные | /produkciya/truby-besshovnye/holodnodeformirovannye | detail | 1 |
| Трубы | Котельные и крекинговые | /produkciya/truby-besshovnye/kotelnye | detail | 1 |
| Трубы | Нержавеющие и коррозионностойкие | /produkciya/truby-besshovnye/nerzhaveyushchie | detail | 1 |
| Трубы | Нефтяного сортамента | /produkciya/truby-besshovnye | category | 6 |
| СДТ | Отводы бесшовные | /produkciya/sdt/otvody-besshovnye | detail | 1 |
| СДТ | Тройники бесшовные | /produkciya/sdt/troyniki-besshovnye | detail | 1 |
| СДТ | Переходы бесшовные | /produkciya/sdt/perekhody-besshovnye | detail | 1 |
| СДТ | Фланцы | /produkciya/sdt/flantsy | detail | 1 |
| СДТ | Заглушки и днища | /produkciya/sdt/zaglushki-i-dnishcha | detail | 1 |
| Трубы и СДТ в изоляции | Теплоизоляция ППУ | /produkciya/truby-i-sdt-v-izolyacii/ppu | detail | 1 |
| Трубы и СДТ в изоляции | Экструдированный полиэтилен (ВУС) | /produkciya/truby-i-sdt-v-izolyacii/vus | detail | 1 |
| Трубы и СДТ в изоляции | Эпоксидное покрытие | /produkciya/truby-i-sdt-v-izolyacii/epoksidnaya | detail | 1 |
| Трубы и СДТ в изоляции | ТУМ-лента | /produkciya/truby-i-sdt-v-izolyacii/tum-lenta | detail | 1 |
| Трубы и СДТ в изоляции | СДТ в изоляции | /produkciya/truby-i-sdt-v-izolyacii/sdt-v-izolyacii | detail | 1 |
| Листовой и рулонный прокат | Лист г/к | /produkciya/listovoy-prokat/goryachekatanyj | detail | 1 |
| Листовой и рулонный прокат | Лист х/к | /produkciya/listovoy-prokat/holodnokatanyj | detail | 1 |
| Листовой и рулонный прокат | Оцинкованный прокат | /produkciya/listovoy-prokat/ocinkovannyj | detail | 1 |
| Листовой и рулонный прокат | Лист рифлёный | /produkciya/listovoy-prokat/list-riflenyj | detail | 1 |
| Листовой и рулонный прокат | Лист ПВЛ | /produkciya/listovoy-prokat/list-pvl | detail | 1 |
| Листовой и рулонный прокат | Профнастил | /produkciya/listovoy-prokat/profnastil | detail | 1 |
| Сортовой и фасонный прокат | Арматура | /produkciya/sortovoy-i-fasonny-prokat/armatura | detail | 1 |
| Сортовой и фасонный прокат | Катанка | /produkciya/sortovoy-i-fasonny-prokat/katanka | detail | 1 |
| Сортовой и фасонный прокат | Круг горячекатаный | /produkciya/sortovoy-i-fasonny-prokat/krug-goryachekatanyj | detail | 1 |
| Сортовой и фасонный прокат | Квадрат | /produkciya/sortovoy-i-fasonny-prokat/kvadrat | detail | 1 |
| Сортовой и фасонный прокат | Шестигранник | /produkciya/sortovoy-i-fasonny-prokat/shestigrannik | detail | 1 |
| Сортовой и фасонный прокат | Полоса | /produkciya/sortovoy-i-fasonny-prokat/polosa | detail | 1 |
| Сортовой и фасонный прокат | Уголок | /produkciya/sortovoy-i-fasonny-prokat/ugolok | detail | 1 |
| Сортовой и фасонный прокат | Балка двутавровая | /produkciya/sortovoy-i-fasonny-prokat/balka-dvutavrovaya | detail | 1 |
| Сортовой и фасонный прокат | Швеллер | /produkciya/sortovoy-i-fasonny-prokat/shveller | detail | 1 |
| Сортовой и фасонный прокат | Швеллер гнутый | /produkciya/sortovoy-i-fasonny-prokat/shveller-gnutyj | detail | 1 |
| Рельсы | Рельсы железнодорожные | /produkciya/relsy/zheleznodorozhnye | detail | 1 |
| Рельсы | Рельсы узкоколейные | /produkciya/relsy/promyshlennye | detail | 1 |
| Рельсы | Рельсы крановые | /produkciya/relsy/kranovye | detail | 1 |
| Нержавеющие и специальные стали | Нержавеющий лист | /produkciya/nerzhaveyushchaya-stal/list | detail | 1 |
| Нержавеющие и специальные стали | Нержавеющие трубы | /produkciya/nerzhaveyushchaya-stal/truby | detail | 1 |
| Нержавеющие и специальные стали | Нержавеющий круг и профиль | /produkciya/nerzhaveyushchaya-stal/sortovoy-prokat | detail | 1 |
| Поковки и заготовки | Кольца и диски | /produkciya/pokovki-i-zagotovki/kolca-i-diski | detail | 1 |
| Поковки и заготовки | Валы и оси | /produkciya/pokovki-i-zagotovki/valy | detail | 1 |
| Поковки и заготовки | Поковки по чертежу | /produkciya/pokovki-i-zagotovki/po-chertezhu | detail | 1 |
| Цветной металлопрокат | Медь | /produkciya/cvetnye-metally/med | detail | 1 |
| Цветной металлопрокат | Латунь | /produkciya/cvetnye-metally/latun | detail | 1 |
| Цветной металлопрокат | Бронза | /produkciya/cvetnye-metally/bronza | detail | 1 |
| Цветной металлопрокат | Алюминий | /produkciya/cvetnye-metally/alyuminij | detail | 1 |
| Цветной металлопрокат | Титан | /produkciya/cvetnye-metally/titan | detail | 1 |
| Цветной металлопрокат | Олово | /produkciya/cvetnye-metally/olovo | detail | 1 |
| Цветной металлопрокат | Свинец | /produkciya/cvetnye-metally/svinec | detail | 1 |
| Цветной металлопрокат | Цинк | /produkciya/cvetnye-metally/cink | detail | 1 |
| Цветной металлопрокат | Нихром | /produkciya/cvetnye-metally/nihrom | detail | 1 |
| Цветной металлопрокат | Баббит | /produkciya/cvetnye-metally/babbit | detail | 1 |
| Метизы и сварочные материалы | Крепёж | /produkciya/metizy-i-svarochnye-materialy/krepezh | detail | 1 |
| Метизы и сварочные материалы | Сетки | /produkciya/metizy-i-svarochnye-materialy/setki | detail | 1 |
| Метизы и сварочные материалы | Лента упаковочная | /produkciya/metizy-i-svarochnye-materialy/lenta-upakovochnaya | detail | 1 |
| Метизы и сварочные материалы | Проволока и электроды | /produkciya/metizy-i-svarochnye-materialy/svarochnye-materialy | detail | 1 |
| Оборудование и комплектующие | Оборудование и комплектующие | / | request | 0 |

## Подробные страницы и доказательства

| Страница | URL | Покрытие в коде | Таблиц | Источник подбора | Нормативный review |
|---|---|---|---:|---|---|
| Рельсы железнодорожные | /produkciya/relsy/zheleznodorozhnye | procurement_guide | 0 | internal_procurement_reference | не выполнен |
| Рельсы узкоколейные | /produkciya/relsy/promyshlennye | procurement_guide | 0 | internal_procurement_reference | не выполнен |
| Рельсы крановые | /produkciya/relsy/kranovye | procurement_guide | 0 | internal_procurement_reference | не выполнен |
| Лист нержавеющий | /produkciya/nerzhaveyushchaya-stal/list | size_series | 2 | — | не выполнен |
| Трубы нержавеющие | /produkciya/nerzhaveyushchaya-stal/truby | size_series | 2 | — | не выполнен |
| Нержавеющий сортовой прокат | /produkciya/nerzhaveyushchaya-stal/sortovoy-prokat | size_series | 4 | external_source_candidate | не выполнен |
| Медный прокат | /produkciya/cvetnye-metally/med | size_series | 1 | — | не выполнен |
| Латунный прокат | /produkciya/cvetnye-metally/latun | size_series | 1 | — | не выполнен |
| Бронзовый прокат и заготовки | /produkciya/cvetnye-metally/bronza | size_series | 1 | — | не выполнен |
| Алюминиевый прокат | /produkciya/cvetnye-metally/alyuminij | size_series | 1 | — | не выполнен |
| Титановый прокат | /produkciya/cvetnye-metally/titan | size_series | 1 | — | не выполнен |
| Олово и продукция на его основе | /produkciya/cvetnye-metally/olovo | procurement_guide | 1 | external_source_candidate | не выполнен |
| Свинец и свинцовый прокат | /produkciya/cvetnye-metally/svinec | procurement_guide | 1 | external_source_candidate | не выполнен |
| Цинк и цинковые материалы | /produkciya/cvetnye-metally/cink | procurement_guide | 1 | external_source_candidate | не выполнен |
| Нихромовый прокат | /produkciya/cvetnye-metally/nihrom | size_series | 1 | — | не выполнен |
| Баббиты оловянные и свинцовые | /produkciya/cvetnye-metally/babbit | procurement_guide | 1 | external_source_candidate | не выполнен |
| Кованые кольца и диски | /produkciya/pokovki-i-zagotovki/kolca-i-diski | procurement_guide | 0 | external_source_candidate | не выполнен |
| Кованые валы и оси | /produkciya/pokovki-i-zagotovki/valy | procurement_guide | 0 | external_source_candidate | не выполнен |
| Поковки по чертежу | /produkciya/pokovki-i-zagotovki/po-chertezhu | procurement_guide | 0 | external_source_candidate | не выполнен |
| Лист горячекатаный | /produkciya/listovoy-prokat/goryachekatanyj | size_series | 3 | — | не выполнен |
| Лист холоднокатаный | /produkciya/listovoy-prokat/holodnokatanyj | size_series | 3 | — | не выполнен |
| Лист и рулон оцинкованный | /produkciya/listovoy-prokat/ocinkovannyj | size_series | 2 | — | не выполнен |
| Лист рифлёный | /produkciya/listovoy-prokat/list-riflenyj | product_description | 0 | — | не выполнен |
| Лист просечно-вытяжной (ПВЛ) | /produkciya/listovoy-prokat/list-pvl | product_description | 0 | — | не выполнен |
| Профнастил | /produkciya/listovoy-prokat/profnastil | product_description | 0 | — | не выполнен |
| Арматура | /produkciya/sortovoy-i-fasonny-prokat/armatura | product_description | 0 | — | не выполнен |
| Катанка | /produkciya/sortovoy-i-fasonny-prokat/katanka | product_description | 0 | — | не выполнен |
| Круг и квадрат стальной | /produkciya/sortovoy-i-fasonny-prokat/krug-i-kvadrat | product_description | 0 | — | не выполнен |
| Балка, швеллер и уголок | /produkciya/sortovoy-i-fasonny-prokat/balka-shveller-ugolok | product_description | 0 | — | не выполнен |
| Круг горячекатаный 5–270 мм | /produkciya/sortovoy-i-fasonny-prokat/krug-goryachekatanyj | size_series | 1 | — | не выполнен |
| Квадрат стальной 3–200 мм | /produkciya/sortovoy-i-fasonny-prokat/kvadrat | size_series | 2 | — | не выполнен |
| Шестигранник стальной | /produkciya/sortovoy-i-fasonny-prokat/shestigrannik | product_description | 0 | — | не выполнен |
| Полоса стальная горячекатаная | /produkciya/sortovoy-i-fasonny-prokat/polosa | size_series | 1 | — | не выполнен |
| Уголок равнополочный, неравнополочный и гнутый | /produkciya/sortovoy-i-fasonny-prokat/ugolok | size_series | 2 | — | не выполнен |
| Балка двутавровая | /produkciya/sortovoy-i-fasonny-prokat/balka-dvutavrovaya | size_series | 8 | — | не выполнен |
| Швеллер горячекатаный | /produkciya/sortovoy-i-fasonny-prokat/shveller | size_series | 5 | — | не выполнен |
| Швеллер гнутый | /produkciya/sortovoy-i-fasonny-prokat/shveller-gnutyj | product_description | 0 | — | не выполнен |
| Промышленный крепёж | /produkciya/metizy-i-svarochnye-materialy/krepezh | size_series | 1 | — | не выполнен |
| Сетки | /produkciya/metizy-i-svarochnye-materialy/setki | product_description | 0 | — | не выполнен |
| Лента упаковочная холоднокатаная | /produkciya/metizy-i-svarochnye-materialy/lenta-upakovochnaya | product_description | 0 | — | не выполнен |
| Сварочные материалы | /produkciya/metizy-i-svarochnye-materialy/svarochnye-materialy | size_series | 1 | external_source_candidate | не выполнен |
| Трубы электросварные прямошовные | /produkciya/truby-elektrosvarnye/pryamoshovnye | size_series | 1 | — | не выполнен |
| Трубы электросварные спиральношовные | /produkciya/truby-elektrosvarnye/spiraleshovnye | size_series | 2 | — | не выполнен |
| Трубы водогазопроводные | /produkciya/truby-elektrosvarnye/vodogazoprovodnye | size_series | 2 | — | не выполнен |
| Трубы профильные | /produkciya/truby-elektrosvarnye/profilnye | size_series | 6 | — | не выполнен |
| Трубы сварные для магистральных трубопроводов | /produkciya/truby-elektrosvarnye/magistralnye | size_series | 1 | — | не выполнен |
| Трубы бесшовные горячедеформированные | /produkciya/truby-besshovnye/goryachedeformirovannye | size_series | 1 | — | не выполнен |
| Трубы бесшовные холоднодеформированные | /produkciya/truby-besshovnye/holodnodeformirovannye | size_series | 2 | — | не выполнен |
| Трубы котельные бесшовные | /produkciya/truby-besshovnye/kotelnye | size_series | 5 | external_source_candidate | не выполнен |
| Трубы крекинговые | /produkciya/truby-besshovnye/krekingovye | size_series | 1 | — | не выполнен |
| Трубы бесшовные нержавеющие | /produkciya/truby-besshovnye/nerzhaveyushchie | size_series | 2 | — | не выполнен |
| Трубы стальные прецизионные | /produkciya/truby-besshovnye/precizionnye | size_series | 2 | external_source_candidate | не выполнен |
| Трубы и фасонные изделия в ППУ-изоляции | /produkciya/truby-i-sdt-v-izolyacii/ppu | size_series | 2 | external_source_candidate | не выполнен |
| Трубы с изоляцией экструдированным полиэтиленом | /produkciya/truby-i-sdt-v-izolyacii/vus | procurement_guide | 1 | external_source_candidate | не выполнен |
| Трубы и фасонные изделия с эпоксидным покрытием | /produkciya/truby-i-sdt-v-izolyacii/epoksidnaya | procurement_guide | 1 | external_source_candidate | не выполнен |
| Фасонные изделия с покрытием ТУМ-лентой | /produkciya/truby-i-sdt-v-izolyacii/tum-lenta | procurement_guide | 1 | external_source_candidate | не выполнен |
| СДТ и фасонные изделия в изоляции | /produkciya/truby-i-sdt-v-izolyacii/sdt-v-izolyacii | size_series | 2 | external_source_candidate | не выполнен |
| Отводы бесшовные приварные | /produkciya/sdt/otvody-besshovnye | size_series | 4 | — | не выполнен |
| Отводы сварные секторные | /produkciya/sdt/otvody-svarnye | procurement_guide | 0 | external_source_candidate | не выполнен |
| Тройники бесшовные приварные | /produkciya/sdt/troyniki-besshovnye | size_series | 4 | — | не выполнен |
| Тройники сварные | /produkciya/sdt/troyniki-svarnye | procurement_guide | 0 | external_source_candidate | не выполнен |
| Переходы бесшовные приварные | /produkciya/sdt/perekhody-besshovnye | size_series | 2 | — | не выполнен |
| Переходы сварные | /produkciya/sdt/perekhody-svarnye | procurement_guide | 0 | external_source_candidate | не выполнен |
| Заглушки и днища трубопроводов | /produkciya/sdt/zaglushki-i-dnishcha | size_series | 2 | — | не выполнен |
| Фланцы стальные | /produkciya/sdt/flantsy | size_series | 2 | — | не выполнен |

## Как продолжать проверку

Полный состав заявлений, размерных источников, их названия/URL и ограничения
содержит [coverage.json](coverage.json). `internal:` — внутренняя памятка
параметров заказа, **не нормативный первоисточник**. Исторические provenance
и исследования связываются в [рабочем отчёте](../../ai/CATALOG_NEXT_2026-11-01.md);
их результаты не превращены автоматически в новое одобрение всех карточек.

Для каждой проверяемой позиции нужны точный раздел/таблица первоисточника,
применимость стандарта к форме и состоянию изделия, проверенные размеры и
марки, независимый reviewer и отдельное доказательство публикации.
Текущие `not_assessed`/`not_performed` нельзя менять по одному HTTP 200
или успешному поисковому тесту.

Воспроизведение из корня checkout (сначала убедиться, что src/data не изменён):

```bash
git diff --quiet HEAD -- src/data
CATALOG_SOURCE_SHA="$(git rev-parse HEAD)" node --import tsx scripts/generate-catalog-coverage.ts
```
