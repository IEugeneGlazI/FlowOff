namespace Flowoff.Domain.Entities;

public class PromotionGift
{
    public Guid PromotionId { get; private set; }
    public Promotion? Promotion { get; private set; }
    public Guid GiftId { get; private set; }
    public Gift? Gift { get; private set; }

    private PromotionGift()
    {
    }

    public PromotionGift(Guid promotionId, Guid giftId)
    {
        PromotionId = promotionId;
        GiftId = giftId;
    }
}
