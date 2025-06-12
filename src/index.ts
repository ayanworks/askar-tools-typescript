import { agentDependencies } from "@credo-ts/node"
import { AskarWalletPostgresStorageConfig } from "@credo-ts/askar"

import { Command } from "commander"
import { MultiWalletConverter } from "./multiWalletConverter"
import { AskarWalletSqliteStorageConfig } from "@credo-ts/askar/build/wallet"
import { Exporter } from "./exporter"

const program = new Command("askar-tools-javascript")

program
  .requiredOption(
    "--strategy <strategy>",
    "Specify strategy to be used. Choose from 'mt-convert-to-mw', or 'import-tenant'.",
    (value) => {
      if (!["mt-convert-to-mw", "import-tenant", "export"].includes(value)) {
        throw new Error(
          "Invalid strategy. Choose from 'mt-convert-to-mw', or 'import-tenant'."
        )
      }
      return value
    }
  )
  .option(
    "--storage-type <type>",
    "Specify storage type. Choose from 'sqlite' or 'postgres'.",
    (value) => {
      if (!["sqlite", "postgres"].includes(value)) {
        throw new Error(
          "Invalid storage type. Choose from 'sqlite' or 'postgres'."
        )
      }
      return value
    },
    "sqlite"
  )
  .requiredOption(
    "--wallet-id <walletName>",
    "Specify wallet-id to be migrated."
  )
  .requiredOption("--wallet-key <walletKey>", "Specify wallet key.")
  .option("--postgres-host <host>", "Specify host for postgres storage.")
  .option(
    "--postgres-username <username>",
    "Specify username for postgres storage."
  )
  .option(
    "--postgres-password <password>",
    "Specify password for postgres storage."
  )
  .option("--tenant-id <id>", "Specify tenant-id to be migrated.")
  .option(
    "--database-scheme <scheme>",
    "Specify database scheme to be migrated. Choose from 'DatabasePerWallet' or 'ProfilePerWallet'.",
    (value) => {
      if (!["DatabasePerWallet", "ProfilePerWallet"].includes(value)) {
        throw new Error(
          "Invalid database scheme. Choose from 'DatabasePerWallet' or 'ProfilePerWallet'."
        )
      }
      return value
    },
    "ProfilePerWallet"
  )

const main = async () => {
  const options = program.opts()

  console.log("🚀 ~ main ~ options:", options)

  let method
  let exporterMethod
  let storageType:| AskarWalletPostgresStorageConfig| AskarWalletSqliteStorageConfig

  switch (options.strategy) {
    case "export":
      if (options.storageType === "postgres") {
        storageType = {
          type: "postgres",
          config: {
            host: options.postgresHost,
          },
          credentials: {
            account: options.postgresUsername,
            password: options.postgresPassword,
          },
        }
      } else {
        storageType = {
          type: "sqlite",
        }
      }

      exporterMethod = new Exporter({
        fileSystem: new agentDependencies.FileSystem(),
        walletConfig: {
          id: options.walletId,
          key: options.walletKey,
          storage: storageType,
        },
        tenantId: options.tenantId,
        databaseScheme: options.databaseScheme,
      })
      await exporterMethod.export()
      break
    case "mt-convert-to-mw":
      let storage:
        | AskarWalletPostgresStorageConfig
        | AskarWalletSqliteStorageConfig

      if (options.storageType === "postgres") {
        storage = {
          type: "postgres",
          config: {
            host: options.postgresHost,
          },
          credentials: {
            account: options.postgresUsername,
            password: options.postgresPassword,
          },
        }
      } else {
        storage = {
          type: "sqlite",
        }
      }

      method = new MultiWalletConverter({
        fileSystem: new agentDependencies.FileSystem(),
        walletConfig: {
          id: options.walletId,
          key: options.walletKey,
          storage,
        },
        tenantId: options.tenantId,
      })
      await method.run()
      break

    case "tenant-import":
      throw new Error("Not implemented")
      break

    default:
      throw new Error("Invalid strategy")
  }
}

program.action(() => {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
})

program.parse(process.argv)
