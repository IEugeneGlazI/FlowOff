namespace Flowoff.Domain.Entities;

public class BouquetColor
{
    public Guid BouquetId { get; private set; }
    public Bouquet? Bouquet { get; private set; }
    public Guid ColorId { get; private set; }
    public Color? Color { get; private set; }

    private BouquetColor()
    {
    }

    public BouquetColor(Guid bouquetId, Guid colorId)
    {
        BouquetId = bouquetId;
        ColorId = colorId;
    }
}
