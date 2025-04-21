import { ethers } from 'ethers';
import { AstrixSDKConfig, ErrorType } from '../types/core';
import { AstrixSDKError } from '../types/errors';
import { ContractAddresses } from '../types/contracts';
import { TokenModule } from '../modules/token';
import { PointsModule } from '../modules/points';
import { TribesModule } from '../modules/tribes';
import { ProfilesModule } from '../modules/profiles';
import { ContentModule } from '../modules/content';
import { OrganizationsModule } from '../modules/organizations';
import { AnalyticsModule } from '../modules/analytics';
import { getContractAddressesByChainId } from '../config/contracts';

/**
 * Core SDK class for interacting with the Tribes by Astrix platform
 */
export class AstrixSDK {
  // Provider and signer
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Signer | null = null;
  
  // Configuration
  private readonly config: AstrixSDKConfig;
  
  // Modules
  private _token: TokenModule | null = null;
  private _points: PointsModule | null = null;
  private _tribes: TribesModule | null = null;
  private _profiles: ProfilesModule | null = null;
  private _content: ContentModule | null = null;
  private _organizations: OrganizationsModule | null = null;
  private _analytics: AnalyticsModule | null = null;
  
  // Contract addresses for the Astrix ecosystem
  private contractAddresses: ContractAddresses = {} as ContractAddresses;
  
  /**
   * Create a new instance of the SDK
   * @param config Configuration options
   */
  constructor(config: AstrixSDKConfig) {
    this.config = config;
    
    // Initialize provider
    if (typeof config.provider === 'string') {
      this.provider = new ethers.JsonRpcProvider(config.provider);
    } else {
      this.provider = config.provider;
    }
    
    // Initialize modules
    this.initializeModules();
  }

  /**
   * Async initialization method to be called after construction
   */
  public async init(): Promise<void> {
    await this.initContractAddresses(this.config.contracts);
  }
  
  /**
   * Initialize all modules
   */
  private initializeModules(): void {
    try {
      // Initialize modules without signer for read-only operations
      this._token = new TokenModule(this.provider, this.config);
      this._points = new PointsModule(this.provider, this.config);
      this._tribes = new TribesModule(this.provider, this.config);
      this._profiles = new ProfilesModule(this.provider, this.config);
      this._content = new ContentModule(this.provider, this.config);
      this._organizations = new OrganizationsModule(this.provider, this.config);
      this._analytics = new AnalyticsModule(this.provider, this.config);
    } catch (error) {
      throw new AstrixSDKError(
        ErrorType.SDK_ERROR,
        'Failed to initialize SDK modules',
        undefined,
        error
      );
    }
  }
  
  /**
   * Initialize contract addresses based on the connected network and any overrides
   * @param contractOverrides Optional contract address overrides
   */
  private async initContractAddresses(contractAddresses?: ContractAddresses): Promise<void> {
    if (contractAddresses) {
      // Use provided contract addresses
      this.contractAddresses = contractAddresses;
      if (this.config.verbose) {
        console.log('Using provided contract addresses');
      }
    } else {
      // Get the network from the provider
      const network = await this.provider.getNetwork();
      const chainId = Number(network.chainId);
      
      // Get default addresses for this network
      try {
        const addresses = getContractAddressesByChainId(chainId);
        if (!addresses) {
          throw new Error(`Unsupported network: ${chainId}. Please provide custom contract addresses.`);
        }
        this.contractAddresses = addresses;
        if (this.config.verbose) {
          console.log(`Initialized with contract addresses for chain ID ${chainId}`);
        }
      } catch (error) {
        throw new Error(`Unsupported network: ${chainId}. Please provide custom contract addresses.`);
      }
    }
  }
  
  /**
   * Connect with a signer (wallet)
   * @param signer Ethers signer object
   */
  public async connect(signer: ethers.Signer): Promise<void> {
    try {
      this.signer = signer;
      
      // Reinitialize modules with signer
      if (this._token) this._token.setSigner(signer);
      if (this._points) this._points.setSigner(signer);
      if (this._tribes) this._tribes.setSigner(signer);
      if (this._profiles) this._profiles.setSigner(signer);
      if (this._content) this._content.setSigner(signer);
      if (this._organizations) this._organizations.setSigner(signer);
      if (this._analytics) this._analytics.setSigner(signer);
      
      if (this.config.verbose) {
        const address = await signer.getAddress();
        console.log(`Connected with address: ${address}`);
      }
    } catch (error) {
      throw new AstrixSDKError(
        ErrorType.CONNECTION_ERROR,
        'Failed to connect signer',
        undefined,
        error
      );
    }
  }
  
  /**
   * Check if the SDK is connected with a signer
   */
  public isConnected(): boolean {
    return this.signer !== null;
  }
  
  /**
   * Get the connected address
   */
  public async getAddress(): Promise<string> {
    if (!this.signer) {
      throw new AstrixSDKError(
        ErrorType.CONNECTION_ERROR,
        'No signer connected'
      );
    }
    
    return await this.signer.getAddress();
  }
  
  /**
   * Get the provider
   */
  public getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }
  
  /**
   * Get the signer
   */
  public getSigner(): ethers.Signer | null {
    return this.signer;
  }
  
  /**
   * Get the configuration
   */
  public getConfig(): AstrixSDKConfig {
    return this.config;
  }
  
  /**
   * Get the contract address for a specific contract
   * @param contractName Name of the contract
   * @returns Contract address
   */
  getContractAddress(contractName: keyof ContractAddresses): string {
    const address = this.contractAddresses[contractName];
    if (!address || address === '0x0000000000000000000000000000000000000000') {
      throw new Error(`Contract address not configured for ${String(contractName)}`);
    }
    return address;
  }
  
  /**
   * Get the token module
   */
  public get token(): TokenModule {
    if (!this._token) {
      throw new AstrixSDKError(
        ErrorType.SDK_ERROR,
        'Token module not initialized'
      );
    }
    return this._token;
  }
  
  /**
   * Get the points module
   */
  public get points(): PointsModule {
    if (!this._points) {
      throw new AstrixSDKError(
        ErrorType.SDK_ERROR,
        'Points module not initialized'
      );
    }
    return this._points;
  }
  
  /**
   * Get the tribes module
   */
  public get tribes(): TribesModule {
    if (!this._tribes) {
      throw new AstrixSDKError(
        ErrorType.SDK_ERROR,
        'Tribes module not initialized'
      );
    }
    return this._tribes;
  }
  
  /**
   * Get the profiles module
   */
  public get profiles(): ProfilesModule {
    if (!this._profiles) {
      throw new AstrixSDKError(
        ErrorType.SDK_ERROR,
        'Profiles module not initialized'
      );
    }
    return this._profiles;
  }
  
  /**
   * Get the content module
   */
  public get content(): ContentModule {
    if (!this._content) {
      throw new AstrixSDKError(
        ErrorType.SDK_ERROR,
        'Content module not initialized'
      );
    }
    return this._content;
  }
  
  /**
   * Get the organizations module
   */
  public get organizations(): OrganizationsModule {
    if (!this._organizations) {
      throw new AstrixSDKError(
        ErrorType.SDK_ERROR,
        'Organizations module not initialized'
      );
    }
    return this._organizations;
  }
  
  /**
   * Get the analytics module
   */
  public get analytics(): AnalyticsModule {
    if (!this._analytics) {
      throw new AstrixSDKError(
        ErrorType.SDK_ERROR,
        'Analytics module not initialized'
      );
    }
    return this._analytics;
  }
} 