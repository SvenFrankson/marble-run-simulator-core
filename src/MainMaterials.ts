namespace MarbleRunSimulatorCore {
    export class MainMaterials {
        public metalMaterials: BABYLON.PBRMetallicRoughnessMaterial[] = [];
        public getMetalMaterial(colorIndex: number): BABYLON.PBRMetallicRoughnessMaterial {
            return this.metalMaterials[colorIndex % this.metalMaterials.length];
        }
        public velvetMaterial: BABYLON.StandardMaterial;
        public logoMaterial: BABYLON.StandardMaterial;
        public baseAxisMaterial: BABYLON.StandardMaterial;
        public leatherMaterial: BABYLON.StandardMaterial;
        public whiteMaterial: BABYLON.StandardMaterial;
        public paintingLight: BABYLON.StandardMaterial;
        public handleMaterial: BABYLON.StandardMaterial;
        public ghostMaterial: BABYLON.StandardMaterial;
        public gridMaterial: BABYLON.StandardMaterial;
        public cyanMaterial: BABYLON.StandardMaterial;
        public redMaterial: BABYLON.StandardMaterial;
        public greenMaterial: BABYLON.StandardMaterial;
        public blueMaterial: BABYLON.StandardMaterial;
        public whiteAutolitMaterial: BABYLON.StandardMaterial;
        public whiteFullLitMaterial: BABYLON.StandardMaterial;
        public earth: BABYLON.PBRMetallicRoughnessMaterial;

        constructor(public game: IGame) {
            this.handleMaterial = new BABYLON.StandardMaterial("handle-material");
            this.handleMaterial.diffuseColor.copyFromFloats(0, 0, 0);
            this.handleMaterial.specularColor.copyFromFloats(0, 0, 0);
            this.handleMaterial.alpha = 1;

            this.ghostMaterial = new BABYLON.StandardMaterial("ghost-material");
            this.ghostMaterial.diffuseColor.copyFromFloats(0.8, 0.8, 1);
            this.ghostMaterial.specularColor.copyFromFloats(0, 0, 0);
            this.ghostMaterial.alpha = 0.3;

            this.gridMaterial = new BABYLON.StandardMaterial("grid-material");
            this.gridMaterial.diffuseColor.copyFromFloats(0, 0, 0);
            this.gridMaterial.specularColor.copyFromFloats(0, 0, 0);
            //this.gridMaterial.alpha = this.game.config.getValue("gridOpacity");

            this.cyanMaterial = new BABYLON.StandardMaterial("cyan-material");
            this.cyanMaterial.diffuseColor = BABYLON.Color3.FromHexString("#00FFFF");
            this.cyanMaterial.specularColor.copyFromFloats(0, 0, 0);

            this.redMaterial = new BABYLON.StandardMaterial("red-material");
            this.redMaterial.diffuseColor = BABYLON.Color3.FromHexString("#bf212f");
            this.redMaterial.emissiveColor = BABYLON.Color3.FromHexString("#bf212f");
            this.redMaterial.specularColor.copyFromFloats(0, 0, 0);

            this.greenMaterial = new BABYLON.StandardMaterial("green-material");
            this.greenMaterial.diffuseColor = BABYLON.Color3.FromHexString("#006f3c");
            this.greenMaterial.emissiveColor = BABYLON.Color3.FromHexString("#006f3c");
            this.greenMaterial.specularColor.copyFromFloats(0, 0, 0);

            this.blueMaterial = new BABYLON.StandardMaterial("blue-material");
            this.blueMaterial.diffuseColor = BABYLON.Color3.FromHexString("#264b96");
            this.blueMaterial.emissiveColor = BABYLON.Color3.FromHexString("#264b96");
            this.blueMaterial.specularColor.copyFromFloats(0, 0, 0);

            this.whiteAutolitMaterial = new BABYLON.StandardMaterial("white-autolit-material");
            this.whiteAutolitMaterial.diffuseColor = BABYLON.Color3.FromHexString("#baccc8");
            this.whiteAutolitMaterial.emissiveColor = BABYLON.Color3.FromHexString("#baccc8").scaleInPlace(0.5);
            this.whiteAutolitMaterial.specularColor.copyFromFloats(0, 0, 0);

            this.whiteFullLitMaterial = new BABYLON.StandardMaterial("white-autolit-material");
            this.whiteFullLitMaterial.diffuseColor = BABYLON.Color3.FromHexString("#baccc8");
            this.whiteFullLitMaterial.emissiveColor = BABYLON.Color3.FromHexString("#baccc8");
            this.whiteFullLitMaterial.specularColor.copyFromFloats(0, 0, 0);

            let steelMaterial = new BABYLON.PBRMetallicRoughnessMaterial("pbr", this.game.scene);
            steelMaterial.baseColor = new BABYLON.Color3(0.5, 0.75, 1.0);
            steelMaterial.metallic = 1.0;
            steelMaterial.roughness = 0.15;
            steelMaterial.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("./lib/marble-run-simulator-core/datas/environment/environmentSpecular.env", this.game.scene);

            let copperMaterial = new BABYLON.PBRMetallicRoughnessMaterial("pbr", this.game.scene);
            copperMaterial.baseColor = BABYLON.Color3.FromHexString("#B87333");
            copperMaterial.metallic = 1.0;
            copperMaterial.roughness = 0.15;
            copperMaterial.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("./lib/marble-run-simulator-core/datas/environment/environmentSpecular.env", this.game.scene);

            let plasticIndigo = new BABYLON.PBRMetallicRoughnessMaterial("pbr", this.game.scene);
            plasticIndigo.baseColor = BABYLON.Color3.FromHexString("#004777");
            plasticIndigo.metallic = 0;
            plasticIndigo.roughness = 0.9;
            plasticIndigo.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("./lib/marble-run-simulator-core/datas/environment/environmentSpecular.env", this.game.scene);

            let plasticRed = new BABYLON.PBRMetallicRoughnessMaterial("pbr", this.game.scene);
            plasticRed.baseColor = BABYLON.Color3.FromHexString("#A30000");
            plasticRed.metallic = 0;
            plasticRed.roughness = 0.9;
            plasticRed.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("./lib/marble-run-simulator-core/datas/environment/environmentSpecular.env", this.game.scene);
            
            let plasticOrange = new BABYLON.PBRMetallicRoughnessMaterial("pbr", this.game.scene);
            plasticOrange.baseColor = BABYLON.Color3.FromHexString("#FF7700");
            plasticOrange.metallic = 0;
            plasticOrange.roughness = 0.9;
            plasticOrange.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("./lib/marble-run-simulator-core/datas/environment/environmentSpecular.env", this.game.scene);

            let plasticYellow = new BABYLON.PBRMetallicRoughnessMaterial("pbr", this.game.scene);
            plasticYellow.baseColor = BABYLON.Color3.FromHexString("#EFD28D");
            plasticYellow.metallic = 0;
            plasticYellow.roughness = 0.9;
            plasticYellow.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("./lib/marble-run-simulator-core/datas/environment/environmentSpecular.env", this.game.scene);

            let plasticGreen = new BABYLON.PBRMetallicRoughnessMaterial("pbr", this.game.scene);
            plasticGreen.baseColor = BABYLON.Color3.FromHexString("#00AFB5");
            plasticGreen.metallic = 0;
            plasticGreen.roughness = 0.9;
            plasticGreen.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("./lib/marble-run-simulator-core/datas/environment/environmentSpecular.env", this.game.scene);

            this.metalMaterials = [steelMaterial, copperMaterial, plasticIndigo, plasticRed, plasticOrange, plasticYellow, plasticGreen];

            this.velvetMaterial = new BABYLON.StandardMaterial("velvet-material");
            this.velvetMaterial.diffuseColor.copyFromFloats(0.75, 0.75, 0.75);
            this.velvetMaterial.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/velvet.jpg");
            this.velvetMaterial.specularColor.copyFromFloats(0, 0, 0);

            this.logoMaterial = new BABYLON.StandardMaterial("logo-material");
            this.logoMaterial.diffuseColor.copyFromFloats(1, 1, 1);
            this.logoMaterial.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/logo-white-no-bg.png");
            this.logoMaterial.diffuseTexture.hasAlpha = true;
            this.logoMaterial.useAlphaFromDiffuseTexture = true;
            this.logoMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);
            this.logoMaterial.alpha = 0.3;

            this.baseAxisMaterial = new BABYLON.StandardMaterial("logo-material");
            this.baseAxisMaterial.diffuseColor.copyFromFloats(1, 1, 1);
            this.baseAxisMaterial.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/axis.png");
            this.baseAxisMaterial.diffuseTexture.hasAlpha = true;
            this.baseAxisMaterial.useAlphaFromDiffuseTexture = true;
            this.baseAxisMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);

            this.leatherMaterial = new BABYLON.StandardMaterial("leather-material");
            this.leatherMaterial.diffuseColor.copyFromFloats(0.05, 0.02, 0.02);
            this.leatherMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);

            this.whiteMaterial = new BABYLON.StandardMaterial("white-material");
            this.whiteMaterial.diffuseColor.copyFromFloats(0.9, 0.95, 1).scaleInPlace(0.9);
            this.whiteMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);

            this.paintingLight = new BABYLON.StandardMaterial("autolit-material");
            this.paintingLight.diffuseColor.copyFromFloats(1, 1, 1);
            this.paintingLight.emissiveTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/painting-light.png");
            this.paintingLight.specularColor.copyFromFloats(0.1, 0.1, 0.1);

            this.earth = new BABYLON.PBRMetallicRoughnessMaterial("pbr", this.game.scene);
            this.earth.baseColor = BABYLON.Color3.FromHexString("#FFFFFF");
            this.earth.metallic = 0.7;
            this.earth.roughness = 0.3;
            this.earth.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("./lib/marble-run-simulator-core/datas/environment/environmentSpecular.env", this.game.scene);
            this.earth.baseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/earth.png");
        }
    }
}
