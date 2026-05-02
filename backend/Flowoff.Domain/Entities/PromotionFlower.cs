namespace Flowoff.Domain.Entities;

public class PromotionFlower
{
    public Guid PromotionId { get; private set; }
    public Promotion? Promotion { get; private set; }
    public Guid FlowerId { get; private set; }
    public Flower? Flower { get; private set; }

    private PromotionFlower()
    {
    }

    public PromotionFlower(Guid promotionId, Guid flowerId)
    {
        PromotionId = promotionId;
        FlowerId = flowerId;
    }
}
