import { KeyDerivationMethod, WalletConfig, FileSystem } from "@credo-ts/core"
import { Store } from "@hyperledger/aries-askar-nodejs"
import {
  keyDerivationMethodToStoreKeyMethod,
  uriFromWalletConfig,
} from "@credo-ts/askar/build/utils"
import { writeFileSync } from "fs"
import { join } from "path"
import { AskarMultiWalletDatabaseScheme } from "@credo-ts/askar"

/**
 * Class responsible for exporting wallet data.
 */
export class Exporter {
  private walletConfig: WalletConfig
  private fileSystem: FileSystem
  private profileId: string
  private tenantId: string
  private databaseScheme: string

  /**
   * Constructor for the Exporter class.
   * @param walletConfig - Configuration for the wallet.
   * @param fileSystem - File system instance.
   * @param tenantId - Tenant ID for the profile.
   */
  constructor({
    walletConfig,
    fileSystem,
    tenantId,
    databaseScheme
  }: {
    walletConfig: WalletConfig
    fileSystem: FileSystem
    tenantId: string
    databaseScheme: string
  }) {
    this.walletConfig = walletConfig
    this.fileSystem = fileSystem
    this.profileId = `tenant-${tenantId}`
    this.tenantId = tenantId
    this.databaseScheme = databaseScheme
  }

  /**
   * Export the wallet data to a JSON file.
   */
  public async export(strategy:string): Promise<void> {
    try {
      const askarWalletConfig = await this.getAskarWalletConfig(this.walletConfig)
      const store = await Store.open({
        uri: askarWalletConfig.uri.uri,
        keyMethod: askarWalletConfig.keyMethod,
        passKey: askarWalletConfig.passKey,
      })
      console.log("🚀 Store opened:", store)
      if (this.databaseScheme === AskarMultiWalletDatabaseScheme.ProfilePerWallet) {
        await this.getDecodedItemsAndTags(store);
      } else if (this.databaseScheme === AskarMultiWalletDatabaseScheme.DatabasePerWallet) {
        await this.processStoreData(store, askarWalletConfig);
      } else {
        console.warn(`Unknown strategy`);
      }
    } catch (error) {
      console.error("🚀 ~ Exporter ~ export ~ error:", error)
    }
  }
  /**
   * Get decoded items and tags from the store and write them to a JSON file.
   * @param store - The store instance.
   */
  private async getDecodedItemsAndTags(store: Store): Promise<void> {
    const profiles = await store.listProfiles()
    console.log("🚀 ~ Exporter ~ getDecodedItemsAndTags ~ profiles:", profiles)

    const filteredData: Record<string, any[]> = {}

    const profile = profiles.find(profileId => profileId === this.profileId)
    if (!profile) {
      throw new Error(`Profile with id ${this.profileId} not found`)
    }

    const scan = store.scan({ profile })
    const data = await scan.fetchAll()
    for (const entry of data) {
      if (!filteredData[entry.category]) {
        filteredData[entry.category] = []
      }
      filteredData[entry.category].push(entry)
    }

    // Write filtered data to a JSON file
    const outputPath = join(__dirname, "../sharedTenantExportedWallet.json")
    writeFileSync(outputPath, JSON.stringify(filteredData, null, 2))
    console.log(`Filtered data written to ${outputPath}`)
  }

   private async processStoreData(store: any, askarWalletConfig): Promise<void> {
      const data = await this.fetchDataFromStore(store);
      const tenantRecord = this.findTenantRecord(data, this.tenantId);
  
      if (!tenantRecord) {
        throw new Error('Tenant not found in the base wallet');
      }
  
      const { walletId, walletKey } = this.extractWalletConfig(tenantRecord);
      console.log(`Wallet ID: ${walletId}`);
      console.log(`Wallet Key: ${walletKey}`);
  
      const baseUri = askarWalletConfig.uri.uri.split('/').slice(0, -1).join('/');
      const tenantUri = `${baseUri}/${walletId}`;
  
      const tenantStore = await Store.open({
        uri: tenantUri,
        keyMethod: keyDerivationMethodToStoreKeyMethod(KeyDerivationMethod.Raw),
        passKey: walletKey,
      });
  
      const tenantData = await this.fetchDataFromStore(tenantStore);
      this.processTenantData(tenantData);
    }
  
    private async fetchDataFromStore(store: any){
      try {
        const scan = store.scan({});
        const records = await scan.fetchAll();
        return records;
      } catch (error) {
        console.error("Error fetching data from store:", error);
        throw new Error("Failed to fetch data from store");
      }
    }
  
    private findTenantRecord(data, tenantId: string) {
      return data.find(record => record.category === 'TenantRecord' && record.name === tenantId);
    }
  
    private extractWalletConfig(record): { walletId: string, walletKey: string } {
      const value = JSON.parse(record.value);
      return {
        walletId: value.config.walletConfig.id,
        walletKey: value.config.walletConfig.key,
      };
    }
  
    private processTenantData(data): void {
      const filteredData = {};
  
      for (const entry of data) {
        if (!filteredData[entry.category]) {
          filteredData[entry.category] = [];
        }
        filteredData[entry.category].push(entry);
      }
  
      const outputPath = join(__dirname, "../DB_per_wallet_exportedWallet.json")
      writeFileSync(outputPath, JSON.stringify(filteredData, null, 2))
      console.log(`Filtered data written to ${outputPath}`)
    }

  /**
   * Get the Askar wallet configuration.
   * @param walletConfig - The wallet configuration.
   * @returns The Askar wallet configuration.
   */
  private async getAskarWalletConfig(walletConfig: WalletConfig) {
    return {
      uri: uriFromWalletConfig(walletConfig, this.fileSystem.dataPath),
      keyMethod: keyDerivationMethodToStoreKeyMethod(walletConfig.keyDerivationMethod ?? KeyDerivationMethod.Argon2IMod),
      passKey: walletConfig.key,
    }
  }
}