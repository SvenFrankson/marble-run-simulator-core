class MachineName {

    public static PartOnes = [
        "The ",
        "A ",
        "Our ",
        "My ",
        ""
    ];

    public static PartTwos = [
        "Great ",
        "Magnificent ",
        "Intricated ",
        "Simple ",
        "Nice ",
        "Cool ",
        "Complex "
    ];

    public static PartThrees = [
        "Ball ",
        "Loop ",
        "Curve ",
        "Rail ",
        "Spiral ",
        "Steel ",
        "Track "
    ];

    public static PartFours = [
        "Machine",
        "Factory",
        "Thing",
        "Invention",
        "Construction",
        "Computer"
    ];

    public static GetRandom(): string {
        let r1 = Math.floor(Math.random() * MachineName.PartOnes.length);
        let r2 = Math.floor(Math.random() * MachineName.PartTwos.length);
        let r3 = Math.floor(Math.random() * MachineName.PartThrees.length);
        let r4 = Math.floor(Math.random() * MachineName.PartFours.length);

        return MachineName.PartOnes[r1] + MachineName.PartTwos[r2] + MachineName.PartThrees[r3] + MachineName.PartFours[r4];
    }
}