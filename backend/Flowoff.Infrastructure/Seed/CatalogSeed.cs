using Flowoff.Domain.Entities;
using Flowoff.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Flowoff.Infrastructure.Seed;

public static class CatalogSeed
{
    public static async Task SeedAsync(FlowoffDbContext dbContext)
    {
        var categories = await EnsureCategoriesAsync(dbContext);
        var flowerTypes = await EnsureFlowerInsAsync(dbContext);
        var colors = await EnsureColorsAsync(dbContext);

        await SeedFlowersAsync(dbContext, flowerTypes, colors);
        await SeedBouquetsAsync(dbContext, flowerTypes, colors);
        await SeedGiftsAsync(dbContext, categories);
    }

    private static async Task<Dictionary<string, Category>> EnsureCategoriesAsync(FlowoffDbContext dbContext)
    {
        var existing = await dbContext.Categories.ToDictionaryAsync(item => item.Name, CancellationToken.None);

        Category GetOrCreate(string name, string description)
        {
            if (existing.TryGetValue(name, out var category))
            {
                return category;
            }

            category = new Category(name, description);
            existing[name] = category;
            dbContext.Categories.Add(category);
            return category;
        }

        GetOrCreate("Шары", "Воздушные шары и праздничные композиции.");
        GetOrCreate("Сладости", "Шоколад, макаронc и сладкие подарочные наборы.");
        GetOrCreate("Продуктовые корзины", "Корзины с деликатесами и гастрономическими наборами.");
        GetOrCreate("Фруктовые корзины", "Подарочные корзины со свежими фруктами.");
        GetOrCreate("Мягкие игрушки", "Плюшевые игрушки и романтичные сувениры.");
        GetOrCreate("Вазы", "Стеклянные и керамические вазы для букетов.");
        GetOrCreate("Свечи", "Ароматические свечи и интерьерный декор.");

        await dbContext.SaveChangesAsync();
        return existing;
    }

    private static async Task<Dictionary<string, FlowerIn>> EnsureFlowerInsAsync(FlowoffDbContext dbContext)
    {
        var existing = await dbContext.FlowerIns.ToDictionaryAsync(item => item.Name, CancellationToken.None);

        FlowerIn GetOrCreate(string name)
        {
            if (existing.TryGetValue(name, out var flowerIn))
            {
                return flowerIn;
            }

            flowerIn = new FlowerIn(name);
            existing[name] = flowerIn;
            dbContext.FlowerIns.Add(flowerIn);
            return flowerIn;
        }

        GetOrCreate("Роза");
        GetOrCreate("Пион");
        GetOrCreate("Тюльпан");
        GetOrCreate("Хризантема");
        GetOrCreate("Лилия");
        GetOrCreate("Гербера");
        GetOrCreate("Орхидея");
        GetOrCreate("Гвоздика");
        GetOrCreate("Эустома");
        GetOrCreate("Маттиола");

        await dbContext.SaveChangesAsync();
        return existing;
    }

    private static async Task<Dictionary<string, Color>> EnsureColorsAsync(FlowoffDbContext dbContext)
    {
        var existing = await dbContext.Colors.ToDictionaryAsync(item => item.Name, CancellationToken.None);

        Color GetOrCreate(string name)
        {
            if (existing.TryGetValue(name, out var color))
            {
                return color;
            }

            color = new Color(name);
            existing[name] = color;
            dbContext.Colors.Add(color);
            return color;
        }

        GetOrCreate("Красный");
        GetOrCreate("Белый");
        GetOrCreate("Розовый");
        GetOrCreate("Желтый");
        GetOrCreate("Сиреневый");
        GetOrCreate("Кремовый");
        GetOrCreate("Зеленый");
        GetOrCreate("Оранжевый");
        GetOrCreate("Бордовый");
        GetOrCreate("Голубой");

        await dbContext.SaveChangesAsync();
        return existing;
    }

    private static async Task SeedFlowersAsync(
        FlowoffDbContext dbContext,
        IReadOnlyDictionary<string, FlowerIn> flowerTypes,
        IReadOnlyDictionary<string, Color> colors)
    {
        var existingNames = await dbContext.Flowers.Select(item => item.Name).ToHashSetAsync();

        void Add(string name, string description, decimal price, string flowerType, string color)
        {
            if (existingNames.Contains(name))
            {
                return;
            }

            dbContext.Flowers.Add(new Flower(
                name,
                description,
                null,
                price,
                flowerTypes[flowerType].Id,
                colors[color].Id));

            existingNames.Add(name);
        }

        Add("Красная роза Эквадор", "Классическая красная роза с крупным бутоном.", 220m, "Роза", "Красный");
        Add("Белая роза Мондиаль", "Белая роза для моно-букетов и свадебных композиций.", 240m, "Роза", "Белый");
        Add("Пион розовый", "Пышный сезонный пион с насыщенным ароматом.", 360m, "Пион", "Розовый");
        Add("Тюльпан белый", "Свежий тюльпан для весенних букетов.", 140m, "Тюльпан", "Белый");
        Add("Тюльпан желтый", "Яркий солнечный тюльпан.", 140m, "Тюльпан", "Желтый");
        Add("Хризантема кустовая", "Стойкая ветка хризантемы для объемных композиций.", 190m, "Хризантема", "Белый");
        Add("Лилия белая", "Элегантная лилия с крупным раскрытием.", 320m, "Лилия", "Белый");
        Add("Гербера оранжевая", "Яркая гербера для солнечных букетов.", 170m, "Гербера", "Оранжевый");
        Add("Орхидея цимбидиум", "Премиальная орхидея для акцентных букетов.", 480m, "Орхидея", "Сиреневый");
        Add("Гвоздика кремовая", "Нежная кремовая гвоздика для теплых композиций.", 120m, "Гвоздика", "Кремовый");
        Add("Эустома белая", "Воздушная эустома с деликатным цветением.", 210m, "Эустома", "Белый");
        Add("Маттиола сиреневая", "Ароматная маттиола для авторских букетов.", 260m, "Маттиола", "Сиреневый");

        await dbContext.SaveChangesAsync();
    }

    private static async Task SeedBouquetsAsync(
        FlowoffDbContext dbContext,
        IReadOnlyDictionary<string, FlowerIn> flowerTypes,
        IReadOnlyDictionary<string, Color> colors)
    {
        var existingNames = await dbContext.Bouquets.Select(item => item.Name).ToHashSetAsync();

        void Add(
            string name,
            string description,
            decimal price,
            string[] flowerInNames,
            string[] colorNames)
        {
            if (existingNames.Contains(name))
            {
                return;
            }

            dbContext.Bouquets.Add(new Bouquet(
                name,
                description,
                null,
                price,
                flowerInNames.Select(item => flowerTypes[item].Id),
                colorNames.Select(item => colors[item].Id)));

            existingNames.Add(name);
        }

        Add("Нежное утро", "Букет из белых тюльпанов, эустомы и эвкалипта.", 3450m, ["Тюльпан", "Эустома"], ["Белый", "Зеленый"]);
        Add("Пионовое облако", "Пышный букет из розовых пионов и маттиолы.", 5900m, ["Пион", "Маттиола"], ["Розовый", "Сиреневый"]);
        Add("Алые чувства", "Романтичный букет из красных роз и зелени.", 4200m, ["Роза"], ["Красный", "Зеленый"]);
        Add("Садовый бриз", "Бело-зеленый букет с лилиями и эустомой.", 5150m, ["Лилия", "Эустома"], ["Белый", "Зеленый"]);
        Add("Солнечный день", "Яркий букет с желтыми тюльпанами и герберами.", 2980m, ["Тюльпан", "Гербера"], ["Желтый", "Оранжевый"]);
        Add("Лавандовая дымка", "Букет с маттиолой, орхидеей и хризантемой.", 5480m, ["Маттиола", "Орхидея", "Хризантема"], ["Сиреневый", "Белый"]);
        Add("Белый шелк", "Свадебный букет из белых роз и эустомы.", 6100m, ["Роза", "Эустома"], ["Белый"]);
        Add("Теплый вечер", "Композиция в кремово-розовой гамме с гвоздикой и пионами.", 4670m, ["Гвоздика", "Пион"], ["Кремовый", "Розовый"]);
        Add("Весенний акцент", "Свежий букет из тюльпанов, хризантемы и эвкалипта.", 2790m, ["Тюльпан", "Хризантема"], ["Белый", "Зеленый"]);
        Add("Городской сад", "Современный букет в свободной сборке с фактурой и объемом.", 6350m, ["Роза", "Орхидея", "Эустома"], ["Бордовый", "Сиреневый", "Зеленый"]);

        await dbContext.SaveChangesAsync();
    }

    private static async Task SeedGiftsAsync(
        FlowoffDbContext dbContext,
        IReadOnlyDictionary<string, Category> categories)
    {
        var existingNames = await dbContext.Gifts.Select(item => item.Name).ToHashSetAsync();

        void Add(string name, string description, decimal price, string categoryName)
        {
            if (existingNames.Contains(name))
            {
                return;
            }

            dbContext.Gifts.Add(new Gift(
                name,
                description,
                null,
                price,
                categories[categoryName].Id));

            existingNames.Add(name);
        }

        Add("Набор шаров «Праздничный микс»", "Связка из семи шаров в пастельных оттенках.", 1350m, "Шары");
        Add("Шары «С днем рождения»", "Фольгированные и латексные шары для поздравления.", 1890m, "Шары");
        Add("Сердце из шаров", "Романтичная композиция из воздушных шаров.", 2450m, "Шары");
        Add("Коробка макаронc", "Набор французских макаронc в подарочной коробке.", 1250m, "Сладости");
        Add("Шоколадный набор премиум", "Ассорти ручных конфет и шоколада.", 2100m, "Сладости");
        Add("Клубника в шоколаде", "Свежая клубника в молочном и белом шоколаде.", 2650m, "Сладости");
        Add("Продуктовая корзина «Итальянский вечер»", "Сыры, гриссини, оливки и соусы в подарочной корзине.", 4900m, "Продуктовые корзины");
        Add("Продуктовая корзина «Сыр и орехи»", "Подарочная корзина с сырами, орехами и джемом.", 5600m, "Продуктовые корзины");
        Add("Фруктовая корзина «Цитрус»", "Апельсины, мандарины, грейпфрут и виноград.", 3350m, "Фруктовые корзины");
        Add("Фруктовая корзина «Премиум»", "Экзотические фрукты и ягоды в большой корзине.", 6200m, "Фруктовые корзины");
        Add("Плюшевый медведь большой", "Мягкий медведь бежевого цвета высотой 60 см.", 3200m, "Мягкие игрушки");
        Add("Плюшевый зайка", "Нежная мягкая игрушка для романтичного подарка.", 1850m, "Мягкие игрушки");
        Add("Стеклянная ваза цилиндр", "Прозрачная ваза для высоких букетов.", 1450m, "Вазы");
        Add("Керамическая ваза «Шалфей»", "Матовая светло-зеленая ваза для интерьерных композиций.", 2350m, "Вазы");
        Add("Ароматическая свеча «Белый чай»", "Свеча в стеклянном стакане с мягким ароматом белого чая.", 990m, "Свечи");
        Add("Свеча «Зеленый сад»", "Интерьерная свеча с цветочно-травяным ароматом.", 1190m, "Свечи");

        await dbContext.SaveChangesAsync();
    }
}
