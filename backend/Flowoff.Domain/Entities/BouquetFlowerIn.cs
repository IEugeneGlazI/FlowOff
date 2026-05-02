namespace Flowoff.Domain.Entities;

public class BouquetFlowerIn
{
    public Guid BouquetId { get; private set; }
    public Bouquet? Bouquet { get; private set; }
    public Guid FlowerInId { get; private set; }
    public FlowerIn? FlowerIn { get; private set; }

    private BouquetFlowerIn()
    {
    }

    public BouquetFlowerIn(Guid bouquetId, Guid flowerInId)
    {
        BouquetId = bouquetId;
        FlowerInId = flowerInId;
    }
}
