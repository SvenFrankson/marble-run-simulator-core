namespace MarbleRunSimulatorCore {
    export enum MaterialType {
        Plastic,
        Metal
    }
    
    export enum BallMaterialType {
        Metal,
        Logo
    }

    export class MainMaterials {
        private _materialsPBR: BABYLON.Material[] = [];
        private _materialsSTD: BABYLON.Material[] = [];
        public getMaterial(colorIndex: number, materialQ: number): BABYLON.Material {
            if (materialQ === MaterialQuality.PBR) {
                return this._materialsPBR[colorIndex % this._materialsPBR.length];
            }
            return this._materialsSTD[colorIndex % this._materialsSTD.length];
        }
        public getMaterialType(colorIndex: number): MaterialType {
            if (colorIndex >= 6 && colorIndex <= 14) {
                return MaterialType.Plastic;
            }
            return MaterialType.Metal;
        }
        public getBallMaterialType(colorIndex: number): BallMaterialType {
            if (colorIndex >= 2 && colorIndex <= 8) {
                return BallMaterialType.Logo;
            }
            return BallMaterialType.Metal;
        }
        public getMaterialHexBaseColor(colorIndex: number, materialQ: number): string {
            let material = this.getMaterial(colorIndex, materialQ);
            if (material instanceof BABYLON.StandardMaterial) {
                return material.diffuseColor.toHexString();
            }
            if (material instanceof BABYLON.PBRMetallicRoughnessMaterial) {
                return material.baseColor.toHexString();
            }
            return "#ffffff";
        }
        public getBallMaterialHexBaseColor(colorIndex: number, materialQ: number): string {
            let material = this.getBallMaterial(colorIndex, materialQ);
            if (material instanceof BABYLON.StandardMaterial) {
                return material.diffuseColor.toHexString();
            }
            if (material instanceof BABYLON.PBRMetallicRoughnessMaterial) {
                return material.baseColor.toHexString();
            }
            return "#ffffff";
        }
        public get metalMaterialsCount(): number {
            return Math.min(this._materialsPBR.length, this._materialsSTD.length);
        }

        private _ballMaterialsPBR: BABYLON.Material[] = [];
        private _ballMaterialsSTD: BABYLON.Material[] = [];
        private _parkourBallMaterialPBR: BABYLON.Material;
        private _parkourBallMaterialSTD: BABYLON.Material;
        public getBallMaterial(colorIndex: number, materialQ: number): BABYLON.Material {
            if (materialQ === MaterialQuality.PBR) {
                return this._ballMaterialsPBR[colorIndex % this._ballMaterialsPBR.length];
            }
            return this._ballMaterialsSTD[colorIndex % this._ballMaterialsSTD.length];
        }
        public getParkourBallMaterial(materialQ: number): BABYLON.Material {
            if (materialQ === MaterialQuality.PBR) {
                return this._parkourBallMaterialPBR;
            }
            return this._parkourBallMaterialSTD;
        }
        public get ballMaterialsCount(): number {
            return Math.min(this._ballMaterialsPBR.length, this._ballMaterialsSTD.length);
        }

        private baseMaterialToBallMaterialTable = [
            { baseIndex: 0, ballIndex: 0 },
            { baseIndex: 1, ballIndex: 1 },
            { baseIndex: 15, ballIndex: 9 },
            { baseIndex: 3, ballIndex: 2 },
            { baseIndex: 4, ballIndex: 3 },
            { baseIndex: 5, ballIndex: 4 },
            { baseIndex: 2, ballIndex: 11 },
        ];
        public ballMaterialIndexToBaseMaterialIndex(ballMaterialIndex: number): number {
            let e = this.baseMaterialToBallMaterialTable.find(e => { return e.ballIndex === ballMaterialIndex });
            if (e) {
                return e.baseIndex;
            }
            return 0;
        }
        public baseMaterialIndexToBallMaterialIndex(baseMaterialIndex: number): number {
            let e = this.baseMaterialToBallMaterialTable.find(e => { return e.baseIndex === baseMaterialIndex });
            if (e) {
                return e.ballIndex;
            }
            return 0;
        }

        private _wallpapers: BABYLON.Material[] = [];
        public getWallpaperMaterial(index: number): BABYLON.Material {
            return this._wallpapers[index];
        }

        public cableMaterial: BABYLON.Material;
        public chainMaterial: BABYLON.Material;
        public velvetMaterial: BABYLON.StandardMaterial;
        public logoMaterial: BABYLON.StandardMaterial;
        public baseAxisMaterial: BABYLON.StandardMaterial;
        public whiteMaterial: BABYLON.StandardMaterial;
        public paintingLight: BABYLON.StandardMaterial;
        public wallShadow: BABYLON.StandardMaterial;
        public slice9Cutoff: BABYLON.StandardMaterial;
        public groundMaterial: BABYLON.StandardMaterial;
        public whiteGroundMaterial: BABYLON.StandardMaterial;
        public handleMaterial: BABYLON.StandardMaterial;
        public ghostMaterial: BABYLON.StandardMaterial;
        public gridMaterial: BABYLON.StandardMaterial;
        public cyanMaterial: BABYLON.StandardMaterial;
        public redMaterial: BABYLON.StandardMaterial;
        public greenMaterial: BABYLON.StandardMaterial;
        public blueMaterial: BABYLON.StandardMaterial;
        public ballAnimationMaterial: BABYLON.StandardMaterial;
        public whiteAutolitMaterial: BABYLON.StandardMaterial;
        public whiteFullLitMaterial: BABYLON.StandardMaterial;
        public steelFullLitMaterial: BABYLON.StandardMaterial;
        public copperFullLitMaterial: BABYLON.StandardMaterial;
        public get plasticBlack(): BABYLON.Material {
            return this.getMaterial(6, MaterialQuality.Standard);
        }
        public plasticWhite: BABYLON.StandardMaterial;
        public selectorFullLitLightBlueMaterial: BABYLON.StandardMaterial;
        public selectorFullLitBlueMaterial: BABYLON.StandardMaterial;
        public selectorFullLitGreenMaterial: BABYLON.StandardMaterial;

        constructor(public game: IGame) {
            let envTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("./lib/marble-run-simulator-core/datas/environment/environmentSpecular.env", this.game.scene);

            this.handleMaterial = new BABYLON.StandardMaterial("handle-material");
            this.handleMaterial.diffuseColor.copyFromFloats(0, 0, 0);
            this.handleMaterial.specularColor.copyFromFloats(0, 0, 0);
            this.handleMaterial.alpha = 1;

            this.ghostMaterial = new BABYLON.StandardMaterial("ghost-material");
            this.ghostMaterial.diffuseColor.copyFromFloats(0.8, 0.8, 1);
            this.ghostMaterial.specularColor.copyFromFloats(0, 0, 0);
            this.ghostMaterial.alpha = 1;

            this.gridMaterial = new BABYLON.StandardMaterial("grid-material");
            this.gridMaterial.diffuseColor.copyFromFloats(0, 0, 0);
            this.gridMaterial.specularColor.copyFromFloats(0, 0, 0);
            //this.gridMaterial.alpha = this.game.config.getValue("gridOpacity");

            this.ballAnimationMaterial = new BABYLON.StandardMaterial("ball-animation-material");
            this.ballAnimationMaterial.diffuseColor.copyFromFloats(0, 0, 0);
            this.ballAnimationMaterial.specularColor.copyFromFloats(0, 0, 0);
            this.ballAnimationMaterial.emissiveColor = new BABYLON.Color3(0.9, 0.1, 0.3);
            this.ballAnimationMaterial.alpha = 0.5;

            this.cyanMaterial = new BABYLON.StandardMaterial("cyan-material");
            this.cyanMaterial.diffuseColor.copyFromFloats(0, 0, 0);
            this.cyanMaterial.emissiveColor.copyFromFloats(0, 1, 1);
            this.cyanMaterial.specularColor.copyFromFloats(0, 0, 0);

            this.whiteAutolitMaterial = new BABYLON.StandardMaterial("white-autolit-material");
            this.whiteAutolitMaterial.diffuseColor = BABYLON.Color3.FromHexString("#baccc8");
            this.whiteAutolitMaterial.emissiveColor = BABYLON.Color3.FromHexString("#baccc8").scaleInPlace(0.5);
            this.whiteAutolitMaterial.specularColor.copyFromFloats(0, 0, 0);

            this.whiteFullLitMaterial = new BABYLON.StandardMaterial("white-autolit-material");
            this.whiteFullLitMaterial.diffuseColor.copyFromFloats(0, 0, 0);
            this.whiteFullLitMaterial.emissiveColor.copyFromFloats(1, 1, 1);
            this.whiteFullLitMaterial.specularColor.copyFromFloats(0, 0, 0);

            this.steelFullLitMaterial = new BABYLON.StandardMaterial("steel-fulllit-material");
            this.steelFullLitMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.6, 0.7);
            this.steelFullLitMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.6, 0.7);
            this.steelFullLitMaterial.specularColor.copyFromFloats(0, 0, 0);

            this.copperFullLitMaterial = new BABYLON.StandardMaterial("copper-fulllit-material");
            this.copperFullLitMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.6, 0.5);
            this.copperFullLitMaterial.emissiveColor = new BABYLON.Color3(0.7, 0.6, 0.5);
            this.copperFullLitMaterial.specularColor.copyFromFloats(0, 0, 0);

            this.selectorFullLitLightBlueMaterial = new BABYLON.StandardMaterial("light-blue-autolit-material");
            this.selectorFullLitLightBlueMaterial.diffuseColor.copyFromFloats(0, 0, 0);
            this.selectorFullLitLightBlueMaterial.emissiveColor = BABYLON.Color3.FromHexString("#392696");
            this.selectorFullLitLightBlueMaterial.specularColor.copyFromFloats(0, 0, 0);

            this.selectorFullLitBlueMaterial = new BABYLON.StandardMaterial("blue-autolit-material");
            this.selectorFullLitBlueMaterial.diffuseColor.copyFromFloats(0, 0, 0);
            this.selectorFullLitBlueMaterial.emissiveColor = BABYLON.Color3.FromHexString("#264b96");
            this.selectorFullLitBlueMaterial.specularColor.copyFromFloats(0, 0, 0);

            this.selectorFullLitGreenMaterial = new BABYLON.StandardMaterial("green-autolit-material");
            this.selectorFullLitGreenMaterial.diffuseColor.copyFromFloats(0, 0, 0);
            this.selectorFullLitGreenMaterial.emissiveColor = BABYLON.Color3.FromHexString("#268396");
            this.selectorFullLitGreenMaterial.specularColor.copyFromFloats(0, 0, 0);
            
            this._generateMaterials(envTexture);

            let plasticIndigo = new BABYLON.PBRMetallicRoughnessMaterial("pbr", this.game.scene);
            plasticIndigo.baseColor = BABYLON.Color3.FromHexString("#004777");
            plasticIndigo.metallic = 0;
            plasticIndigo.roughness = 0.9;
            plasticIndigo.environmentTexture = envTexture;

            let plasticRed = new BABYLON.PBRMetallicRoughnessMaterial("pbr", this.game.scene);
            plasticRed.baseColor = BABYLON.Color3.FromHexString("#A30000");
            plasticRed.metallic = 0;
            plasticRed.roughness = 0.9;
            plasticRed.environmentTexture = envTexture;
            
            let plasticOrange = new BABYLON.PBRMetallicRoughnessMaterial("pbr", this.game.scene);
            plasticOrange.baseColor = BABYLON.Color3.FromHexString("#FF7700");
            plasticOrange.metallic = 0;
            plasticOrange.roughness = 0.9;
            plasticOrange.environmentTexture = envTexture;

            let plasticYellow = new BABYLON.PBRMetallicRoughnessMaterial("pbr", this.game.scene);
            plasticYellow.baseColor = BABYLON.Color3.FromHexString("#EFD28D");
            plasticYellow.metallic = 0;
            plasticYellow.roughness = 0.9;
            plasticYellow.environmentTexture = envTexture;

            let plasticGreen = new BABYLON.PBRMetallicRoughnessMaterial("pbr", this.game.scene);
            plasticGreen.baseColor = BABYLON.Color3.FromHexString("#00AFB5");
            plasticGreen.metallic = 0;
            plasticGreen.roughness = 0.9;
            plasticGreen.environmentTexture = envTexture;

            this.plasticWhite = new BABYLON.StandardMaterial("plastic-black", this.game.scene);
            this.plasticWhite.diffuseColor = BABYLON.Color3.FromHexString("#FFFFFF");
            this.plasticWhite.specularColor.copyFromFloats(0.1, 0.1, 0.1);
            this.plasticWhite.emissiveColor.copyFromFloats(0.3, 0.3, 0.3);

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

            this.whiteMaterial = new BABYLON.StandardMaterial("white-material");
            this.whiteMaterial.diffuseColor.copyFromFloats(0.9, 0.95, 1).scaleInPlace(0.9);
            this.whiteMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);

            this.paintingLight = new BABYLON.StandardMaterial("autolit-material");
            this.paintingLight.diffuseColor.copyFromFloats(1, 1, 1);
            this.paintingLight.emissiveTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/painting-light.png");
            this.paintingLight.specularColor.copyFromFloats(0.1, 0.1, 0.1);

            this.wallShadow = new BABYLON.StandardMaterial("autolit-material");
            this.wallShadow.ambientTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/wall-shadow.png");
            this.wallShadow.specularColor.copyFromFloats(0.1, 0.1, 0.1);
            this.wallShadow.emissiveColor.copyFromFloats(0.2, 0.2, 0.2);

            this.slice9Cutoff = new BABYLON.StandardMaterial("9-slice-cutoff-material");
            this.slice9Cutoff.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/9-slice-rounded.png");
            this.slice9Cutoff.diffuseTexture.hasAlpha = true;
            this.slice9Cutoff.useAlphaFromDiffuseTexture = true;
            this.slice9Cutoff.specularColor.copyFromFloats(0, 0, 0);
            this.slice9Cutoff.emissiveColor.copyFromFloats(1, 1, 1);
            this.slice9Cutoff.transparencyMode = BABYLON.Material.MATERIAL_ALPHATEST; 

            this.groundMaterial = new BABYLON.StandardMaterial("ground-material");
            this.groundMaterial.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/concrete.png");
            this.groundMaterial.diffuseColor = BABYLON.Color3.FromHexString("#3f4c52");
            this.groundMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);

            this.whiteGroundMaterial = new BABYLON.StandardMaterial("ground-material");
            this.whiteGroundMaterial.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/concrete.png");
            this.whiteGroundMaterial.diffuseColor = BABYLON.Color3.FromHexString("#ffffff");
            this.whiteGroundMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);

            let cableMaterial = new BABYLON.StandardMaterial("cable-material");
            cableMaterial.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/cable.png");
            cableMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.6, 0.7).scale(0.75);
            cableMaterial.specularColor = new BABYLON.Color3(1, 1, 1).scale(0.5);
            cableMaterial.emissiveColor = cableMaterial.diffuseColor.scale(0.5);
            cableMaterial.roughness = 0.15;
            cableMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);

            let cableMaterialPBR = new BABYLON.PBRMetallicRoughnessMaterial("steel-pbr", this.game.scene);
            cableMaterialPBR.baseColor = new BABYLON.Color3(0.5, 0.75, 1.0);
            cableMaterialPBR.metallic = 0.8;
            cableMaterialPBR.roughness = 0.4;
            cableMaterialPBR.lightmapTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/cable.png");
            cableMaterialPBR.environmentTexture = envTexture;

            this.cableMaterial = cableMaterial;

            let chainMaterial = new BABYLON.StandardMaterial("cable-material");
            chainMaterial.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/chain.png");
            chainMaterial.diffuseColor.copyFromFloats(1, 1, 1);
            chainMaterial.specularColor = new BABYLON.Color3(1, 1, 1).scale(0.5);
            chainMaterial.emissiveColor = chainMaterial.diffuseColor.scale(0.5);
            chainMaterial.roughness = 0.15;
            chainMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);

            this.chainMaterial = chainMaterial;
            /*
            let makeMetalBallMaterial = (name: string, textureName: string) => {
                let ballMaterial = new BABYLON.PBRMetallicRoughnessMaterial(name, this.game.scene);
                ballMaterial.metallic = 1;
                ballMaterial.roughness = 0.15;
                ballMaterial.environmentTexture = envTexture;
                ballMaterial.baseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/" + textureName, undefined, undefined, false);

                return ballMaterial;
            }
            */

            let makeBrandedBallMaterialSTD = (name: string, textureName: string) => {
                let ballMaterial = new BABYLON.StandardMaterial(name, this.game.scene);
                ballMaterial.specularColor = new BABYLON.Color3(0.7, 0.7, 0.7);
                ballMaterial.roughness = 0.3;
                ballMaterial.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/" + textureName, undefined, undefined, false);
                ballMaterial.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.3);

                return ballMaterial;
            }

            let makeBrandedBallMaterialPBR = (name: string, textureName: string) => {
                let ballMaterial = new BABYLON.PBRMetallicRoughnessMaterial(name, this.game.scene);
                ballMaterial.baseColor = BABYLON.Color3.FromHexString("#FFFFFF");
                ballMaterial.metallic = 0.7;
                ballMaterial.roughness = 0.3;
                ballMaterial.environmentTexture = envTexture;
                ballMaterial.baseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/" + textureName, undefined, undefined, false);

                return ballMaterial;
            }

            this._ballMaterialsPBR = [
                this._materialsPBR[0],
                this._materialsPBR[1],
                makeBrandedBallMaterialPBR("square-red", "ball-square-red.png"),
                makeBrandedBallMaterialPBR("circle-green", "ball-circle-green.png"),
                makeBrandedBallMaterialPBR("star-blue", "ball-star-blue.png"),
                makeBrandedBallMaterialPBR("tiaratum", "ball-tiaratum.png"),
                makeBrandedBallMaterialPBR("html5", "ball-html5.png"),
                makeBrandedBallMaterialPBR("tiaratum", "ball-bjs.png"),
                makeBrandedBallMaterialPBR("poki", "ball-poki.png"),
                this._materialsPBR[15],
                this._materialsPBR[17],
                this._materialsPBR[2],
                this._materialsPBR[3],
                this._materialsPBR[16],
                this._materialsPBR[4],
                this._materialsPBR[5]
            ]

            this._ballMaterialsSTD = [
                this._materialsSTD[0],
                this._materialsSTD[1],
                makeBrandedBallMaterialSTD("square-red", "ball-square-red.png"),
                makeBrandedBallMaterialSTD("circle-green", "ball-circle-green.png"),
                makeBrandedBallMaterialSTD("star-blue", "ball-star-blue.png"),
                makeBrandedBallMaterialSTD("tiaratum", "ball-tiaratum.png"),
                makeBrandedBallMaterialSTD("html5", "ball-html5.png"),
                makeBrandedBallMaterialSTD("tiaratum", "ball-bjs.png"),
                makeBrandedBallMaterialSTD("poki", "ball-poki.png"),
                this._materialsSTD[15],
                this._materialsSTD[17],
                this._materialsSTD[2],
                this._materialsSTD[3],
                this._materialsSTD[16],
                this._materialsSTD[4],
                this._materialsSTD[5]
            ]

            let parkourBallColor = BABYLON.Color3.FromHexString("#0c0c18");

            let parkourBallMaterialPBR = new BABYLON.PBRMetallicRoughnessMaterial("parkour-ball-pbr", this.game.scene);
            parkourBallMaterialPBR.baseColor = parkourBallColor;
            parkourBallMaterialPBR.baseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/ball-parkour.png", undefined, undefined, false);
            parkourBallMaterialPBR.metallic = 0.75;
            parkourBallMaterialPBR.roughness = 0.25;
            parkourBallMaterialPBR.environmentTexture = envTexture;
            
            let parkourBallMaterialSTD = new BABYLON.StandardMaterial("parkour-ball-pbr", this.game.scene);
            parkourBallMaterialSTD.diffuseColor = parkourBallColor.scale(4);
            parkourBallMaterialSTD.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/ball-parkour.png", undefined, undefined, false);
            parkourBallMaterialSTD.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
            parkourBallMaterialSTD.emissiveColor = parkourBallMaterialSTD.diffuseColor.scale(0.5);
            parkourBallMaterialSTD.roughness = 0.25;

            this._parkourBallMaterialPBR = parkourBallMaterialPBR;
            this._parkourBallMaterialSTD = parkourBallMaterialSTD;

            /*
            this._wallpapers = [];

            let abstractBubblesMaterial = new BABYLON.StandardMaterial("abstract-bubbles-material");
            abstractBubblesMaterial.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/wallpapers/abstract-bubbles.png");
            abstractBubblesMaterial.ambientTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/wall-shadow.png");
            abstractBubblesMaterial.ambientTexture.coordinatesIndex = 1;
            abstractBubblesMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);
            abstractBubblesMaterial.emissiveColor.copyFromFloats(0.2, 0.2, 0.2);
            this._wallpapers[0] = abstractBubblesMaterial;
            

            let abstractSquaresMaterial = new BABYLON.StandardMaterial("abstract-squares-material");
            abstractSquaresMaterial.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/wallpapers/abstract-squares.png");
            abstractSquaresMaterial.ambientTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/wall-shadow.png");
            abstractSquaresMaterial.ambientTexture.coordinatesIndex = 1;
            abstractSquaresMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);
            abstractSquaresMaterial.emissiveColor.copyFromFloats(0.2, 0.2, 0.2);
            this._wallpapers[1] = abstractSquaresMaterial;
            */
        }

        private _makePlasticPBR(name: string, color: BABYLON.Color3, envTexture: BABYLON.CubeTexture): BABYLON.Material {
            let plastic = new BABYLON.PBRMetallicRoughnessMaterial(name, this.game.scene);
            plastic.baseColor = color;
            plastic.roughness = 1;
            plastic.environmentTexture = envTexture;

            return plastic;
        }

        private _makePlasticSTD(name: string, color: BABYLON.Color3): BABYLON.StandardMaterial {
            let plastic = new BABYLON.StandardMaterial(name, this.game.scene);
            plastic.diffuseColor = color;
            plastic.emissiveColor = plastic.diffuseColor.scale(0.4).add(new BABYLON.Color3(0.1, 0.1, 0.1));
            plastic.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);

            return plastic;
        }

        private _makeMetalPBR(name: string, color: BABYLON.Color3, envTexture: BABYLON.CubeTexture): BABYLON.Material {
            let metalMaterial = new BABYLON.PBRMetallicRoughnessMaterial(name, this.game.scene);
            metalMaterial.baseColor = color;
            metalMaterial.metallic = 0.75;
            metalMaterial.roughness = 0.25;
            metalMaterial.environmentTexture = envTexture;

            return metalMaterial;
        }

        private _makeMetalSTD(name: string, color: BABYLON.Color3): BABYLON.StandardMaterial {
            let metalMaterial = new BABYLON.StandardMaterial(name, this.game.scene);
            metalMaterial.diffuseColor = color;
            metalMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
            metalMaterial.emissiveColor = metalMaterial.diffuseColor.scale(0.5);
            metalMaterial.roughness = 0.25;

            return metalMaterial;
        }

        private _generateMaterials(envTexture: BABYLON.CubeTexture): void {
            this._materialsPBR = [];
            this._materialsSTD = [];

            let steelMaterialPBR = new BABYLON.PBRMetallicRoughnessMaterial("steel-pbr", this.game.scene);
            steelMaterialPBR.baseColor = new BABYLON.Color3(0.5, 0.75, 1.0);
            steelMaterialPBR.metallic = 1.0;
            steelMaterialPBR.roughness = 0.15;
            steelMaterialPBR.environmentTexture = envTexture;
            
            let steelMaterialSTD = new BABYLON.StandardMaterial("steel-std", this.game.scene);
            steelMaterialSTD.diffuseColor = new BABYLON.Color3(0.5, 0.6, 0.7);
            steelMaterialSTD.specularColor = new BABYLON.Color3(1, 1, 1);
            steelMaterialSTD.emissiveColor = steelMaterialSTD.diffuseColor.scale(0.5);
            steelMaterialSTD.roughness = 0.15;

            this._materialsPBR.push(steelMaterialPBR);
            this._materialsSTD.push(steelMaterialSTD);

            let brassMaterialPBR = new BABYLON.PBRMetallicRoughnessMaterial("brass-pbr", this.game.scene);
            brassMaterialPBR.baseColor = BABYLON.Color3.FromHexString("#B87333");
            brassMaterialPBR.metallic = 0.9;
            brassMaterialPBR.roughness = 0.15;
            brassMaterialPBR.environmentTexture = envTexture;
            
            let brassMaterialSTD = new BABYLON.StandardMaterial("brass-std", this.game.scene);
            brassMaterialSTD.diffuseColor = BABYLON.Color3.FromHexString("#B87333");
            brassMaterialSTD.specularColor = new BABYLON.Color3(1, 1, 1);
            brassMaterialSTD.emissiveColor = brassMaterialSTD.diffuseColor.scale(0.5);
            brassMaterialSTD.roughness = 0.15;

            this._materialsPBR.push(brassMaterialPBR);
            this._materialsSTD.push(brassMaterialSTD);

            this._materialsPBR.push(this._makeMetalPBR("black-steel-pbr", new BABYLON.Color3(0.05, 0.04, 0.045), envTexture));
            this._materialsSTD.push(this._makeMetalSTD("black-steel-std", new BABYLON.Color3(0.05, 0.04, 0.045)));

            this._materialsPBR.push(this._makeMetalPBR("red-steel-pbr", BABYLON.Color3.FromHexString("#e6261f"), envTexture));
            this._materialsSTD.push(this._makeMetalSTD("red-steel-std", BABYLON.Color3.FromHexString("#e6261f")));

            this._materialsPBR.push(this._makeMetalPBR("green-steel-pbr", BABYLON.Color3.FromHexString("#68D62C"), envTexture));
            this._materialsSTD.push(this._makeMetalSTD("green-steel-std", BABYLON.Color3.FromHexString("#68D62C")));

            this._materialsPBR.push(this._makeMetalPBR("blue-steel-pbr", BABYLON.Color3.FromHexString("#14B8B8"), envTexture));
            this._materialsSTD.push(this._makeMetalSTD("blue-steel-std", BABYLON.Color3.FromHexString("#14B8B8")));

            let plasticBlack = new BABYLON.StandardMaterial("plastic-black", this.game.scene);
            plasticBlack.diffuseColor = BABYLON.Color3.FromHexString("#282a33");
            plasticBlack.specularColor.copyFromFloats(0.1, 0.1, 0.1);
            plasticBlack.emissiveColor.copyFromFloats(0.1, 0.1, 0.1);

            this._materialsPBR.push(plasticBlack);
            this._materialsSTD.push(plasticBlack);

            /*#e6261f,#eb7532,#f7d038,#a3e048,#49da9a,#34bbe6,#4355db,#d23be7*/
            
            this._materialsPBR.push(this._makePlasticPBR("red-plastic-pbr", BABYLON.Color3.FromHexString("#e6261f"), envTexture));
            this._materialsSTD.push(this._makePlasticSTD("red-plastic-std", BABYLON.Color3.FromHexString("#e6261f")));
            
            this._materialsPBR.push(this._makePlasticPBR("orange-plastic-pbr", BABYLON.Color3.FromHexString("#eb7532"), envTexture));
            this._materialsSTD.push(this._makePlasticSTD("orange-plastic-std", BABYLON.Color3.FromHexString("#eb7532")));
            
            this._materialsPBR.push(this._makePlasticPBR("yellow-plastic-pbr", BABYLON.Color3.FromHexString("#f7d038"), envTexture));
            this._materialsSTD.push(this._makePlasticSTD("yellow-plastic-std", BABYLON.Color3.FromHexString("#f7d038")));
            
            this._materialsPBR.push(this._makePlasticPBR("green-plastic-pbr", BABYLON.Color3.FromHexString("#7de048"), envTexture));
            this._materialsSTD.push(this._makePlasticSTD("green-plastic-std", BABYLON.Color3.FromHexString("#7de048")));
            
            this._materialsPBR.push(this._makePlasticPBR("eucalyptus-plastic-pbr", BABYLON.Color3.FromHexString("#49da9a"), envTexture));
            this._materialsSTD.push(this._makePlasticSTD("eucalyptus-plastic-std", BABYLON.Color3.FromHexString("#49da9a")));
            
            this._materialsPBR.push(this._makePlasticPBR("blue-plastic-pbr", BABYLON.Color3.FromHexString("#34bbe6"), envTexture));
            this._materialsSTD.push(this._makePlasticSTD("blue-plastic-std", BABYLON.Color3.FromHexString("#34bbe6")));
            
            this._materialsPBR.push(this._makePlasticPBR("royal-blue-plastic-pbr", BABYLON.Color3.FromHexString("#4355db"), envTexture));
            this._materialsSTD.push(this._makePlasticSTD("royal-blue-plastic-std", BABYLON.Color3.FromHexString("#4355db")));
            
            this._materialsPBR.push(this._makePlasticPBR("pink-plastic-pbr", BABYLON.Color3.FromHexString("#d23be7"), envTexture));
            this._materialsSTD.push(this._makePlasticSTD("pink-plastic-std", BABYLON.Color3.FromHexString("#d23be7")));

            let copperMaterialPBR = new BABYLON.PBRMetallicRoughnessMaterial("copper-pbr", this.game.scene);
            copperMaterialPBR.baseColor = BABYLON.Color3.FromHexString("#9c3814");
            copperMaterialPBR.metallic = 0.9;
            copperMaterialPBR.roughness = 0.15;
            copperMaterialPBR.environmentTexture = envTexture;
            
            let copperMaterialSTD = new BABYLON.StandardMaterial("copper-std", this.game.scene);
            copperMaterialSTD.diffuseColor = BABYLON.Color3.FromHexString("#9c3814");
            copperMaterialSTD.specularColor = new BABYLON.Color3(1, 1, 1);
            copperMaterialSTD.emissiveColor = copperMaterialSTD.diffuseColor.scale(0.5);
            copperMaterialSTD.roughness = 0.15;

            this._materialsPBR.push(copperMaterialPBR);
            this._materialsSTD.push(copperMaterialSTD);

            this._materialsPBR.push(this._makeMetalPBR("yellow-steel-pbr", BABYLON.Color3.FromHexString("#f7d038"), envTexture));
            this._materialsSTD.push(this._makeMetalSTD("yellow-steel-std", BABYLON.Color3.FromHexString("#f7d038")));

            this._materialsPBR.push(this._makeMetalPBR("white-steel-pbr", BABYLON.Color3.FromHexString("#FAFFD8"), envTexture));
            this._materialsSTD.push(this._makeMetalSTD("white-steel-std", BABYLON.Color3.FromHexString("#FAFFD8")));
        }
    }
}
