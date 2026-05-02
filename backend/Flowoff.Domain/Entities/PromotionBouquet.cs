namespace Flowoff.Domain.Entities;

public class PromotionBouquet
{
    public Guid PromotionId { get; private set; }
    public Promotion? Promotion { get; private set; }
    public Guid BouquetId { get; private set; }
    public Bouquet? Bouquet { get; private set; }

    private PromotionBouquet()
    {
    }

    public PromotionBouquet(Guid promotionId, Guid bouquetId)
    {
        PromotionId = promotionId;
        BouquetId = bouquetId;
    }
}
