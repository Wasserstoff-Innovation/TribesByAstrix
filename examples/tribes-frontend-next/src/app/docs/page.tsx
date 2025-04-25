"use client";

import React, { useState, useEffect } from 'react';
import { Copy, X, Menu, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { PageContainer } from '../../../components/ui';
import { docsContent, docsSections } from './data';
import { MethodDocumentation } from './data/sdk/tribes';
import { ErrorCode } from './data/error-codes';
import { Guide, GuideStep } from './data/guides';
import { FaInfoCircle } from 'react-icons/fa';
import Link from 'next/link';
import { 
  CodeBracketIcon, 
  DocumentTextIcon, 
  ExclamationCircleIcon, 
  BeakerIcon, 
  ChartBarIcon,
  PresentationChartLineIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

// Documentation structure with nested sections
interface DocSection {
  id: string;
  title: string;
  content?: () => React.ReactNode;
  sections?: DocSection[]; // Add support for nested sections
}

interface DocCategory {
  title: string;
  sections: DocSection[];
}

interface DocStructure {
  [key: string]: DocCategory;
}

// Helper components for UI elements
const cardWithIcon = (icon: React.ReactNode, title: string, description: string) => (
  <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-lg p-6 hover:bg-gray-900 hover:border-accent transition-colors">
    <div className="text-accent text-2xl mb-3">{icon}</div>
    <h3 className="text-white text-lg font-semibold mb-2">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </div>
);

const sectionHeading = (title: string) => (
  <h3 className="text-white text-xl font-semibold mb-4">{title}</h3>
);

const infoBox = (content: string) => (
  <div className="bg-blue-950/50 border border-blue-800 rounded-lg p-4 mb-6">
    <div className="flex">
      <span className="text-blue-400 mr-2">
        <FaInfoCircle size={18} />
      </span>
      <p className="text-blue-100">{content}</p>
    </div>
  </div>
);

const parameterItem = (name: string, type: string, description: string, optional: boolean = false) => (
  <div className="mb-4 pb-4 border-b border-gray-800 last:border-0">
    <div className="flex flex-wrap justify-between items-start mb-2">
      <div className="flex items-center">
        <span className="font-mono text-white mr-2">{name}</span>
        {optional && (
          <span className="text-xs uppercase bg-gray-800 text-gray-400 px-2 py-0.5 rounded">Optional</span>
        )}
      </div>
      <span className="font-mono text-sm bg-gray-800 px-2 py-1 rounded text-accent">{type}</span>
    </div>
    <p className="text-gray-400">{description}</p>
  </div>
);

const renderMethod = (method: MethodDocumentation) => (
  <div className="mb-12 border border-gray-800 rounded-lg p-6 bg-gray-900/50 backdrop-blur-sm">
    <h3 className="text-xl font-semibold mb-1 flex items-center group relative">
      <span className="mr-2 text-accent">{method.name}</span>
      <button 
        onClick={() => navigator.clipboard.writeText(method.name)}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Copy method name"
      >
        <Copy size={14} className="text-gray-500 hover:text-white" />
      </button>
    </h3>
    <p className="text-gray-300 mb-6">{method.description}</p>
    
    {method.parameters && method.parameters.length > 0 && (
      <>
        {sectionHeading('Parameters')}
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
          {method.parameters.map(param => (
            <div key={param.name} className="mb-4 pb-4 border-b border-gray-800 last:border-0">
              <div className="flex flex-wrap justify-between items-start mb-2">
                <div className="flex items-center">
                  <span className="font-mono text-white mr-2">{param.name}</span>
                  {param.optional && (
                    <span className="text-xs uppercase bg-gray-800 text-gray-400 px-2 py-0.5 rounded">Optional</span>
                  )}
                </div>
                <span className="font-mono text-sm bg-gray-800 px-2 py-1 rounded text-accent">{param.type}</span>
              </div>
              <p className="text-gray-400">{param.description}</p>
            </div>
          ))}
        </div>
      </>
    )}
    
    {sectionHeading('Returns')}
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 border border-gray-800 mb-6">
      <div className="flex justify-between items-start mb-2">
        <span className="font-mono text-accent">{method.returns.type}</span>
      </div>
      <p className="text-gray-400">{method.returns.description}</p>
    </div>
    
    {sectionHeading('Example')}
    <CodeBlock code={method.example} language="typescript" />
  </div>
);

const renderErrorCode = (error: ErrorCode) => (
  <div className="mb-8 border border-gray-800 rounded-lg p-5 bg-gray-900/50 backdrop-blur-sm">
    <div className="flex justify-between items-start mb-3">
      <h3 className="text-lg font-semibold text-white">{error.code}</h3>
      <span className="text-sm text-red-400 font-mono px-2 py-1 bg-red-900/20 border border-red-900/30 rounded">{error.message}</span>
    </div>
    <p className="text-gray-300 mb-4">{error.description}</p>
    <h4 className="text-sm font-semibold uppercase text-gray-400 mb-2">Possible Solutions:</h4>
    <ul className="list-disc pl-5 space-y-1 text-gray-300">
      {error.possibleSolutions.map((solution, index) => (
        <li key={index}>{solution}</li>
      ))}
    </ul>
  </div>
);

const renderGuide = (guide: Guide) => (
  <div className="mb-10">
    <div className="mb-6 flex flex-wrap gap-2 items-center">
      <span className={`px-3 py-1 rounded-full text-xs font-medium 
        ${guide.difficulty === 'beginner' ? 'bg-green-900/30 text-green-400 border border-green-900/50' : 
        guide.difficulty === 'intermediate' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-900/50' : 
        'bg-red-900/30 text-red-400 border border-red-900/50'}`}>
        {guide.difficulty.charAt(0).toUpperCase() + guide.difficulty.slice(1)}
      </span>
      <span className="px-3 py-1 rounded-full bg-gray-800 text-gray-300 text-xs">
        {guide.estimated_time}
      </span>
      {guide.tags.map(tag => (
        <span key={tag} className="px-3 py-1 rounded-full bg-gray-900 border border-gray-800 text-gray-400 text-xs">
          #{tag}
        </span>
      ))}
    </div>
    
    <p className="text-gray-300 mb-8">{guide.description}</p>
    
    <div className="space-y-8">
      {guide.steps.map((step, index) => (
        <div key={index} className="border border-gray-800 rounded-lg p-6 bg-gray-900/50 backdrop-blur-sm">
          <div className="flex items-center mb-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-black font-semibold mr-3">
              {index + 1}
            </div>
            <h3 className="text-lg font-semibold">{step.title}</h3>
          </div>
          <p className="text-gray-300 mb-4">{step.description}</p>
          {step.code && (
            <CodeBlock code={step.code} language={step.codeLanguage || 'typescript'} />
          )}
        </div>
      ))}
    </div>
  </div>
);

interface NavItemProps {
  id: string;
  title: string;
  active: boolean;
  onClick: (id: string) => void;
}

function NavItem({ id, title, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`w-full text-left px-4 py-3 rounded-md text-sm mb-1 transition-all hover:bg-accent/10 flex items-center ${
        active ? 'bg-accent/20 text-accent font-medium' : 'text-gray-400 hover:text-white'
      }`}
    >
      {active && (
        <div className="w-1 h-4 bg-accent rounded-sm mr-2"></div>
      )}
      <span className={active ? 'pl-0' : 'pl-3'}>{title}</span>
    </button>
  );
}

interface CategoryProps {
  title: string;
  sections: DocSection[];
  activeSection: string;
  expanded: boolean;
  onToggle: () => void;
  onSectionChange: (id: string) => void;
}

const Category = ({ title, sections, activeSection, expanded, onToggle, onSectionChange }: CategoryProps) => {
  const hasActiveSectionInCategory = sections.some(section => section.id === activeSection);
  
  return (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-3 text-left font-medium rounded-md transition-all ${
          hasActiveSectionInCategory ? 'text-accent bg-accent/5' : 'text-gray-300 hover:text-white'
        }`}
      >
        <span>{title}</span>
        <svg
          className={`transform transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      
      {expanded && (
        <div className="mt-1 pl-2">
          {sections.map(section => (
            <NavItem
              key={section.id}
              id={section.id}
              title={section.title}
              active={activeSection === section.id}
              onClick={onSectionChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface CodeBlockProps {
  code: string;
  language: string;
}

// Code block component with improved mobile styling
const CodeBlock = ({ language, code }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    // Use the clipboard API directly
    try {
      const textArea = document.createElement('textarea');
      textArea.value = code;
      textArea.style.position = 'fixed';  // Avoid scrolling to bottom
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="mb-6 group relative">
      <div className="flex items-center justify-between bg-gray-800/80 backdrop-blur-sm px-4 py-3 rounded-t-lg border-t border-l border-r border-gray-700">
        <div className="bg-accent/50 px-3 py-1 rounded-md text-accent text-sm font-mono">{language}</div>
        <button
          onClick={copyToClipboard}
          className="text-gray-400 hover:text-white transition duration-200 p-2 rounded-md hover:bg-gray-700/50"
          aria-label="Copy code"
        >
          {copied ? (
            <div className="flex items-center">
              <Check size={16} className="text-green-400 mr-1.5" />
              <span className="text-green-400 text-sm">Copied</span>
            </div>
          ) : (
            <Copy size={16} />
          )}
        </button>
      </div>
      <pre className="bg-gray-900/80 backdrop-blur-sm overflow-x-auto p-5 border border-gray-700 rounded-b-lg text-sm md:text-base">
        <code className="text-gray-200 font-mono">{code}</code>
      </pre>
      <div className="absolute -inset-0.5 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  );
};

// Render content based on the activeSection from docsContent
const renderSectionContent = (sectionId: string) => {
  const section = docsContent[sectionId];
  if (!section) return null;

  const content = section.content();

  // Introduction section
  if (sectionId === 'introduction') {
    return (
      <>
        <p className="mb-4 text-lg leading-relaxed">{content.description}</p>
        <p className="text-gray-300 leading-relaxed">{content.overview}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
          {cardWithIcon(
            <div className="text-accent">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-accent">
                <path d="M21 6H19V15H21V6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11 6H9V15H11V6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 15V18H14H10H6H5H3V9M3 6V3H5H6H10H14H16V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>,
            'Create Tribes',
            'Build communities with customizable settings including access controls and membership requirements.'
          )}
          {cardWithIcon(
            <div className="text-accent">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-accent">
                <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3.41 22C3.41 18.13 7.26 15 12 15C12.96 15 13.89 15.13 14.76 15.37" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 18C22 18.75 21.79 19.46 21.42 20.06C21.21 20.42 20.94 20.74 20.63 21C19.93 21.63 19.01 22 18 22C16.54 22 15.27 21.22 14.58 20.06C14.21 19.46 14 18.75 14 18C14 16.74 14.58 15.61 15.5 14.88C16.19 14.33 17.06 14 18 14C20.21 14 22 15.79 22 18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16.44 18L17.5 19.06L19.56 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>,
            'Manage Tokens',
            'Create and distribute community tokens that power your tribe\'s economy and incentives.'
          )}
          {cardWithIcon(
            <div className="text-accent">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-accent">
                <path d="M8.5 14.5L5 18M15.5 14.5L19 18M7 10.5H17M7 6.5H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>,
            'Reward Activities',
            'Set up reward systems to encourage engagement and active participation in your community.'
          )}
        </div>
      </>
    );
  }

  // Installation section
  if (sectionId === 'installation') {
    return (
      <>
        <p className="mb-4">Install the SDK using npm:</p>
        <CodeBlock code={content.npm} language="bash" />
        <p className="mt-4">Or using yarn:</p>
        <CodeBlock code={content.yarn} language="bash" />
        <p className="mt-4">The SDK requires ethers.js v6 as a peer dependency.</p>
      </>
    );
  }

  // Configuration section
  if (sectionId === 'configuration') {
    return (
      <>
        <p className="mb-4">Initialize the SDK with your provider and contract addresses:</p>
        
        {sectionHeading('Basic Setup')}
        <CodeBlock
          code={content.basicSetup}
          language="typescript"
        />
        
        {sectionHeading('Connecting a Wallet')}
        <p className="mb-4">
          For read-only operations, the SDK can be used immediately after initialization. For write operations (creating tribes, joining tribes, etc.), you need to connect a signer:
        </p>
        <CodeBlock
          code={content.connectingWallet}
          language="typescript"
        />
        
        {infoBox(
          'For the development environment, you can find the default contract addresses for Linea Sepolia testnet in the SDK documentation or use the development network provided by Astrix.'
        )}
      </>
    );
  }

  // SDK Overview section
  if (sectionId === 'sdk') {
    return (
      <>
        <p className="mb-4">{content.description}</p>
        
        {sectionHeading('Features')}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {content.features.map((feature: {name: string, description: string}, index: number) => (
            <div key={index} className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
              <h3 className="font-semibold text-accent mb-2">{feature.name}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>
        
        {sectionHeading('Installation')}
        <CodeBlock code={content.installation.npm} language="bash" />
        
        {sectionHeading('Quick Setup')}
        <CodeBlock code={content.setup} language="typescript" />
      </>
    );
  }

  // Tribe Management section
  if (sectionId === 'tribe-management') {
    return (
      <>
        <p className="mb-8">{content.description}</p>
        {content.methods.map((method: MethodDocumentation) => renderMethod(method))}
      </>
    );
  }

  // Points & Tokens section
  if (sectionId === 'points-tokens') {
    return (
      <>
        <p className="mb-8">{content.description}</p>
        {content.methods.map((method: MethodDocumentation) => renderMethod(method))}
      </>
    );
  }

  // Content Management section
  if (sectionId === 'content-management') {
    return (
      <>
        <p className="mb-8">{content.description}</p>
        {content.methods.map((method: MethodDocumentation) => renderMethod(method))}
      </>
    );
  }

  // Collectibles section
  if (sectionId === 'collectibles') {
    return (
      <>
        <p className="mb-8">{content.description}</p>
        {content.methods.map((method: MethodDocumentation) => renderMethod(method))}
      </>
    );
  }

  // Error Codes section
  if (sectionId === 'error-codes') {
    return (
      <>
        <p className="mb-8">{content.description}</p>
        
        <div className="grid grid-cols-1 gap-6">
          {content.errors.map((error: ErrorCode) => renderErrorCode(error))}
        </div>
      </>
    );
  }

  // Contract sections
  if (sectionId === 'contracts-overview') {
    return (
      <>
        <p className="mb-6">{content.description}</p>
        <div className="space-y-4">
          {content.contractList.map((contract: {name: string, description: string}, index: number) => (
            <div key={index} className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-5 border border-gray-800">
              <h3 className="text-lg font-semibold mb-2 text-accent">{contract.name}</h3>
              <p className="text-gray-300">{contract.description}</p>
            </div>
          ))}
        </div>
      </>
    );
  }

  // Individual contract pages
  if (sectionId.includes('controller') || sectionId.includes('system') || sectionId.includes('manager') || sectionId === 'role-manager') {
    return (
      <>
        <p className="mb-6">{content.description}</p>
        
        {sectionHeading('Main Functions')}
        <div className="space-y-8">
          {content.mainFunctions.map((func: any, index: number) => (
            <div key={index} className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-800">
              <h3 className="text-lg font-semibold mb-3 text-accent">{func.name}</h3>
              <p className="text-gray-300 mb-4">{func.description}</p>
              
              {func.parameters && func.parameters.length > 0 && (
                <>
                  <h4 className="font-semibold mb-2">Parameters:</h4>
                  <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 border border-gray-800 mb-4">
                    {func.parameters.map((param: any, pIndex: number) => (
                      <div key={pIndex} className="mb-3 last:mb-0">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-white">{param.name}</span>
                          <span className="font-mono text-sm bg-gray-800 px-2 py-1 rounded text-accent">{param.type}</span>
                        </div>
                        <p className="text-gray-400 text-sm mt-1">{param.description}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              {func.returns && (
                <>
                  <h4 className="font-semibold mb-2">Returns:</h4>
                  <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">Type</span>
                      <span className="font-mono text-sm bg-gray-800 px-2 py-1 rounded text-accent">{func.returns.type}</span>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">{func.returns.description}</p>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </>
    );
  }

  // Guide pages
  if (content.steps) {
    return renderGuide(content as Guide);
  }

  return null;
};

// Enhanced CardLink component with icon and clear visual hierarchy
const CardLink = ({ title, description, href, icon }: { title: string; description: string; href: string; icon: React.ReactNode }) => (
  <a href={href} className="block bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-lg p-6 hover:bg-gray-900 hover:border-accent transition-colors group">
    <div className="text-accent text-2xl mb-3 group-hover:scale-110 transition-transform">{icon}</div>
    <h3 className="text-white text-lg font-semibold mb-2">{title}</h3>
    <p className="text-gray-400">{description}</p>
    <div className="mt-4 text-accent opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
      <span>Explore</span>
      <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </div>
  </a>
);



export default function DocsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('introduction');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'gettingStarted': true,
    'sdk': true,
    'platform': false,
    'contracts': false,
    'guides': false
  });
  const [flattenedSections, setFlattenedSections] = useState<DocSection[]>([]);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);

  // Use the user's current URL path to determine if we should show the homepage or a specific section
  const [isHomepage, setIsHomepage] = useState(true);
  
  useEffect(() => {
    // Check if the URL has a hash
    const hash = window.location.hash;
    if (hash) {
      const sectionId = hash.substring(1); // remove the # character
      if (docsContent[sectionId]) {
        setActiveSection(sectionId);
        setIsHomepage(false);
      }
    }
    
    // Flatten the docs structure for easier navigation
    const flattened = flattenDocs();
    setFlattenedSections(flattened);
    
    // Find the index of the active section in the flattened array
    const index = flattened.findIndex(section => section.id === activeSection);
    if (index !== -1) {
      setActiveSectionIndex(index);
    }
  }, [activeSection]);

  const flattenDocs = () => {
    const flattened: DocSection[] = [];
    
    Object.keys(docsSections).forEach(categoryKey => {
      const category = docsSections[categoryKey as keyof typeof docsSections];
      category.sections.forEach(section => {
        flattened.push(section);
      });
    });
    
    return flattened;
  };

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    setIsHomepage(false);
    
    // Update the URL with the section ID without causing a page reload
    window.history.pushState(null, '', `#${sectionId}`);
    
    // Find the index of the new section
    const index = flattenedSections.findIndex(section => section.id === sectionId);
    if (index !== -1) {
      setActiveSectionIndex(index);
    }
    
    // On mobile, close the menu after selection
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  const navigatePrevious = () => {
    if (activeSectionIndex > 0) {
      const prevSection = flattenedSections[activeSectionIndex - 1];
      handleSectionChange(prevSection.id);
    }
  };

  const navigateNext = () => {
    if (activeSectionIndex < flattenedSections.length - 1) {
      const nextSection = flattenedSections[activeSectionIndex + 1];
      handleSectionChange(nextSection.id);
    }
  };

  const goToHomepage = () => {
    setIsHomepage(true);
    window.history.pushState(null, '', window.location.pathname);
  };

  // Check if we have content for the active section
  const hasContent = docsContent[activeSection] !== undefined;

  return (
    <PageContainer>
      <div className="flex flex-col min-h-screen">
        {/* Mobile Header with menu toggle */}
        <div className="md:hidden bg-gray-900/80 backdrop-blur-md p-4 border-b border-gray-800 sticky top-0 z-30">
          <div className="flex justify-between items-center">
            <button 
              className="text-gray-300 hover:text-white"
              onClick={goToHomepage}
            >
              <span className="text-lg font-semibold">Tribes Docs</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          
          {/* Mobile section title - only show if not homepage */}
          {!isHomepage && hasContent && (
            <div className="mt-2 flex items-center">
              <span className="text-white">{docsContent[activeSection].title}</span>
            </div>
          )}
        </div>

        <div className="flex flex-1 relative">
          {/* Sidebar - Hidden on mobile unless menu is open */}
          <div className={`fixed inset-0 z-20 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 md:w-64 lg:w-72 md:sticky md:top-0 md:h-screen md:max-h-screen bg-gray-900/80 backdrop-blur-md md:border-r border-gray-800 flex flex-col rounded-lg overflow-hidden`}>
            <div className="p-4 md:p-6 bg-gray-900/90 backdrop-blur-md z-10 border-b border-gray-800 flex-shrink-0">
              <div className="flex justify-between items-center mb-6">
                
                {/* Only show close button on mobile */}
                <button 
                  className="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar p-4">
              <nav>
                {/* Navigation categories */}
                {Object.keys(docsSections).map(categoryKey => {
                  const category = docsSections[categoryKey as keyof typeof docsSections];
                  return (
                    <Category
                      key={categoryKey}
                      title={category.title}
                      sections={category.sections}
                      activeSection={activeSection}
                      expanded={expandedCategories[categoryKey]}
                      onToggle={() => toggleCategory(categoryKey)}
                      onSectionChange={handleSectionChange}
                    />
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Mobile overlay to close menu when clicking outside */}
          {mobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-10 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            ></div>
          )}

          {/* Main content area */}
          <div className="flex-1 max-w-full">
            <div className="p-4 md:p-8 lg:p-12 max-w-4xl mx-auto">
                <>
                  {/* Desktop section title */}
                  <div className="hidden md:block mb-6">
                    <h1 className="text-3xl font-bold text-white">{hasContent ? docsContent[activeSection].title : 'Section Not Found'}</h1>
                    <div className="h-1 w-20 bg-gradient-to-r from-accent to-accent/70 rounded-full mt-3"></div>
                  </div>

                  {/* Content */}
                  {hasContent ? (
                    <div className="prose prose-invert max-w-none">
                      {renderSectionContent(activeSection)}
                    </div>
                  ) : (
                    <div className="bg-red-900/20 border border-red-900/40 rounded-lg p-6 text-red-300">
                      <p>The requested section was not found. Please select another section from the navigation menu.</p>
                    </div>
                  )}

                  {/* Navigation buttons for next/previous */}
                  <div className="mt-12 flex justify-between border-t border-gray-800 pt-6">
                    <button
                      onClick={navigatePrevious}
                      disabled={activeSectionIndex === 0}
                      className={`flex items-center ${activeSectionIndex === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}
                    >
                      <ArrowLeft size={16} className="mr-2" />
                      {activeSectionIndex > 0 && (
                        <span>Previous: {flattenedSections[activeSectionIndex - 1].title}</span>
                      )}
                    </button>
                    
                    <button
                      onClick={navigateNext}
                      disabled={activeSectionIndex === flattenedSections.length - 1}
                      className={`flex items-center ${activeSectionIndex === flattenedSections.length - 1 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}
                    >
                      {activeSectionIndex < flattenedSections.length - 1 && (
                        <span>Next: {flattenedSections[activeSectionIndex + 1].title}</span>
                      )}
                      <ArrowRight size={16} className="ml-2" />
                    </button>
                  </div>
                </>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
} 