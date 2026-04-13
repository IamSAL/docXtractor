import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import ScrollReveal from "../components/ScrollReveal";

export const Route = createFileRoute("/")({ component: LandingPage });

function LandingPage() {
  return (
    <div
      className="min-h-screen w-screen overflow-x-hidden text-black antialiased selection:bg-primary selection:text-black font-display bg-white "
      style={{
        backgroundImage: "radial-gradient(#d4d4d4 1.5px, transparent 1.5px)",
        backgroundSize: "24px 24px",
      }}
    >
      <nav className="sticky top-0 z-50 bg-white border-b-4 border-black px-6 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8  flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-black text-white p-1">
              <span className="material-symbols-outlined font-bold block">
                grid_view
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight uppercase">
              DocXTractor
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/IamSAL/docXtractor"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-2 font-bold text-sm hover:underline"
            >
              <img
                src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg"
                alt="GitHub"
                className="w-5 h-5"
              />
              GitHub
            </a>
            <Link to="/login">
              <button className="bg-primary border-[3px] border-black px-5 py-2 font-bold uppercase text-sm neo-shadow hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">
                Launch App
              </button>
            </Link>
          </div>
        </div>
      </nav>
      <section className="py-10 md:py-16 border-b-4 border-black animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <ScrollReveal>
              <div className="flex flex-col items-start text-left gap-5">
                <div className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="font-bold text-xs uppercase tracking-widest">
                    System Operational
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[0.95] tracking-tighter text-black uppercase">
                  Documents In.
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-black to-gray-600">
                    Data Out.
                  </span>
                  <br />
                  Automatically.
                </h1>
                <p className="text-lg md:text-xl font-medium max-w-lg text-gray-800">
                  Industrial-strength document extraction. Turn messy PDFs into
                  clean JSON in seconds.
                </p>
                <div className="flex flex-row gap-4 w-full md:w-auto">
                  <Link to="/login">
                    <button className="bg-primary border-[3px] border-black px-6 py-3 text-base font-black uppercase neo-shadow hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer whitespace-nowrap">
                      Start Extracting
                    </button>
                  </Link>
                  <Link to="/demo">
                    <button className="bg-white border-[3px] border-black px-6 py-3 text-base font-bold uppercase hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap">
                      View Demo
                    </button>
                  </Link>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay="0.2s">
              <div className="w-full relative mt-8 md:mt-0">
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  {/* Input File */}
                  <div className="bg-white border-[3px] border-black p-4 flex flex-col items-center gap-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] transition-all">
                    <span className="material-symbols-outlined text-4xl">
                      description
                    </span>
                    <span className="font-mono text-[10px] font-bold bg-black text-white px-1">
                      INVOICE.PDF
                    </span>
                  </div>

                  {/* Process Node */}
                  <div className="bg-black text-white border-[3px] border-black p-4 flex flex-col items-center justify-center relative rounded-full w-20 h-20 mx-auto z-20">
                    <span className="material-symbols-outlined text-3xl animate-[spin_4s_linear_infinite]">
                      settings
                    </span>
                  </div>

                  {/* Output JSON */}
                  <div className="bg-white border-[3px] border-black p-4 flex flex-col items-center gap-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] transition-all">
                    <span className="material-symbols-outlined text-4xl text-primary">
                      data_object
                    </span>
                    <span className="font-mono text-[10px] font-bold bg-primary text-black px-1">
                      DATA.JSON
                    </span>
                  </div>
                </div>

                {/* Terminal snippet below visual */}
                <div className="mt-8 bg-black p-4 border-[3px] border-black shadow-[8px_8px_0px_0px_#000000] max-w-md mx-auto hidden md:block transform rotate-1">
                  <div className="flex gap-2 mb-2 border-b border-gray-700 pb-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                  <div className="font-mono text-xs text-green-400">
                    <p>&gt; docker run -p 8000:8000 docxtractor/core</p>
                    <p className="text-white mt-1">
                      Starting local extraction engine...
                    </p>
                    <p className="mt-1">
                      <span className="text-yellow-400">✓</span> Ready on port
                      8000
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
      <section className="border-b-4 border-black bg-white py-16 animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-center mb-12">
              Your Data, Your Rules:
              <br />
              Open Source Freedom
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ScrollReveal delay="0.1s">
              <div className="p-8 bg-white border-[3px] border-black neo-shadow h-full">
                <div className="flex items-center gap-4 mb-4">
                  <span className="material-symbols-outlined text-4xl bg-primary p-2 border-2 border-black">
                    terminal
                  </span>
                  <h3 className="text-2xl font-black uppercase">
                    Completely Open Source
                  </h3>
                </div>
                <p className="text-lg font-medium text-gray-700 leading-tight">
                  No black boxes. DocXTractor's core is open source, allowing
                  full auditability, community contributions, and infinite
                  customization to fit your enterprise needs.
                </p>
                <ul className="mt-6 flex flex-col gap-3">
                  <li className="flex items-center gap-2 font-bold">
                    <span className="material-symbols-outlined text-green-600">
                      check_circle
                    </span>{" "}
                    Self-Hostable On-Premise
                  </li>
                  <li className="flex items-center gap-2 font-bold">
                    <span className="material-symbols-outlined text-green-600">
                      check_circle
                    </span>{" "}
                    MIT Licensed Engine
                  </li>
                  <li className="flex items-center gap-2 font-bold">
                    <span className="material-symbols-outlined text-green-600">
                      check_circle
                    </span>{" "}
                    No Vendor Lock-in
                  </li>
                </ul>
              </div>
            </ScrollReveal>
            <ScrollReveal delay="0.3s">
              <div className="p-8 bg-white border-[3px] border-black neo-shadow h-full">
                <div className="flex items-center gap-4 mb-4">
                  <span className="material-symbols-outlined text-4xl bg-black text-white p-2 border-2 border-black">
                    shield_person
                  </span>
                  <h3 className="text-2xl font-black uppercase">
                    Private &amp; Compliant
                  </h3>
                </div>
                <p className="text-lg font-medium text-gray-700 leading-tight">
                  Maintain 100% data sovereignty. Run state-of-the-art
                  extraction on your own hardware, ensuring sensitive documents
                  never leave your secure environment.
                </p>
                <ul className="mt-6 flex flex-col gap-3">
                  <li className="flex items-center gap-2 font-bold">
                    <span className="material-symbols-outlined text-green-600">
                      check_circle
                    </span>{" "}
                    Cloud AI with FreeLLM
                  </li>
                  <li className="flex items-center gap-2 font-bold">
                    <span className="material-symbols-outlined text-green-600">
                      check_circle
                    </span>{" "}
                    Full Data Compliance
                  </li>
                  <li className="flex items-center gap-2 font-bold">
                    <span className="material-symbols-outlined text-green-600">
                      check_circle
                    </span>{" "}
                    Air-Gapped Ready
                  </li>
                </ul>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
      <div className="border-b-4 border-black bg-white py-8 overflow-hidden">
        <div className="marquee font-bold uppercase text-lg tracking-widest opacity-60">
          <div className="marquee-content gap-16 flex items-center">
            <span>TRICKLE.IO</span>
            <span>SUDO TECH</span>
            <span>TRIANGLE SYSTEMS</span>
            <span>SHIELD LOGISTICS</span>
            <span>GLOBAL CORE</span>
            <span>JSON-GEN</span>
            <span>TRICKLE.IO</span>
            <span>SUDO TECH</span>
            <span>TRIANGLE SYSTEMS</span>
          </div>
          <div
            aria-hidden="true"
            className="marquee-content gap-16 flex items-center"
          >
            <span>TRICKLE.IO</span>
            <span>SUDO TECH</span>
            <span>TRIANGLE SYSTEMS</span>
            <span>SHIELD LOGISTICS</span>
            <span>GLOBAL CORE</span>
            <span>JSON-GEN</span>
            <span>TRICKLE.IO</span>
            <span>SUDO TECH</span>
            <span>TRIANGLE SYSTEMS</span>
          </div>
        </div>
      </div>
      <section className="py-16 border-b-4 border-black animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <ScrollReveal>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-8 text-center">
                Intelligent Validation Workflow
              </h2>
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* <div className="hidden md:block absolute top-1/2 left-[30%] right-[30%] h-1 bg-black -translate-y-1/2 z-0"></div> */}

              <ScrollReveal delay="0.1s" className="z-10 h-full">
                <div className="flex flex-col items-center gap-6 bg-white border-[3px] border-black p-8 neo-shadow h-full">
                  <div className="bg-primary border-2 border-black w-16 h-16 flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl font-bold">
                      link
                    </span>
                  </div>
                  <div className="text-center">
                    <h4 className="text-xl font-black uppercase mb-2">
                      Source Citation
                    </h4>
                    <p className="text-sm font-medium text-gray-600">
                      Every extracted field is mapped back to its exact bounding
                      box in the original source document.
                    </p>
                  </div>
                  <div className="w-full bg-gray-50 border-2 border-black p-3 font-mono text-[10px] mt-auto">
                    REF: pg. 12, line 4
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay="0.3s" className="z-10 h-full">
                <div className="flex flex-col items-center gap-6 bg-white border-[3px] border-black p-8 neo-shadow h-full">
                  <div className="bg-black text-white border-2 border-black w-16 h-16 flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl font-bold">
                      group
                    </span>
                  </div>
                  <div className="text-center">
                    <h4 className="text-xl font-black uppercase mb-2">
                      Consensus Review
                    </h4>
                    <p className="text-sm font-medium text-gray-600">
                      Multi-model cross-referencing ensures data integrity by
                      comparing outputs from different AI architectures.
                    </p>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <span className="bg-green-100 text-green-700 px-2 py-1 text-[10px] font-bold border border-green-700">
                      MODEL A ✓
                    </span>
                    <span className="bg-green-100 text-green-700 px-2 py-1 text-[10px] font-bold border border-green-700">
                      MODEL B ✓
                    </span>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay="0.5s" className="z-10 h-full">
                <div className="flex flex-col items-center gap-6 bg-white border-[3px] border-black p-8 neo-shadow h-full">
                  <div className="bg-white border-2 border-black w-16 h-16 flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl font-bold">
                      person_search
                    </span>
                  </div>
                  <div className="text-center">
                    <h4 className="text-xl font-black uppercase mb-2">
                      Human Intervention
                    </h4>
                    <p className="text-sm font-medium text-gray-600">
                      Low-confidence extractions are automatically routed to
                      your team for manual verification and sign-off.
                    </p>
                  </div>
                  <button className="text-[10px] font-bold uppercase underline mt-auto">
                    Review Flagged Item
                  </button>
                </div>
              </ScrollReveal>
            </div>
          </div>
          <ScrollReveal>
            <div className="flex flex-col gap-12">
              <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="max-w-2xl">
                  <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">
                    Visual AutoRun Builder
                  </h2>
                  <p className="text-xl font-medium text-gray-700">
                    Design complex extraction workflows visually. Connect
                    sources, AI models, and destinations with zero code.
                  </p>
                </div>
                <button className="text-lg font-bold border-b-4 border-primary hover:bg-primary/20 px-2 transition-colors">
                  Explore Documentation -&gt;
                </button>
              </div>
              <div className="w-full bg-white border-[2px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="bg-gray-100 border-b-[2px] border-black p-3 flex items-center gap-4">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-white border border-black"></div>
                    <div className="w-3 h-3 rounded-full bg-white border border-black"></div>
                    <div className="w-3 h-3 rounded-full bg-white border border-black"></div>
                  </div>
                  <div className="flex-1 bg-white border border-black px-3 py-1 text-xs font-mono text-gray-500 truncate">
                    https://app.docxtractor.com/builder/workflow-01
                  </div>
                </div>
                <div
                  className="relative h-[500px] bg-gray-50 p-8 overflow-hidden group cursor-grab active:cursor-grabbing"
                  style={{
                    backgroundImage:
                      "url(https://www.transparenttextures.com/patterns/graphy.png)",
                  }}
                >
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    <path
                      d="M 250 100 C 250 200, 250 200, 450 250"
                      fill="none"
                      stroke="black"
                      strokeDasharray="5,5"
                      strokeWidth="2"
                    ></path>
                    <path
                      d="M 450 330 C 450 380, 450 380, 650 400"
                      fill="none"
                      stroke="black"
                      strokeWidth="2"
                    ></path>
                  </svg>
                  <div className="absolute top-10 left-4 md:left-20 w-64 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] z-10 hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <div className="bg-primary/30 p-2 border-b-2 border-black flex justify-between items-center">
                      <span className="font-bold text-sm uppercase">
                        Trigger
                      </span>
                      <span className="material-symbols-outlined text-sm">
                        mail
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="font-bold text-sm mb-2">
                        New Email Attachment
                      </p>
                      <div className="text-xs font-mono bg-gray-100 p-2 border border-gray-300">
                        Filter: *.pdf
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] z-10 hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <div className="bg-primary p-2 border-b-2 border-black flex justify-between items-center">
                      <span className="font-bold text-sm uppercase">
                        Action
                      </span>
                      <span className="material-symbols-outlined text-sm">
                        smart_toy
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="font-bold text-sm mb-2">Extract Data</p>
                      <div className="flex gap-2">
                        <span className="text-[10px] border border-black px-1 rounded">
                          Model: v4
                        </span>
                        <span className="text-[10px] border border-black px-1 rounded">
                          Strict
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-20 right-4 md:right-40 w-64 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] z-10 hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <div className="bg-black text-white p-2 border-b-2 border-black flex justify-between items-center">
                      <span className="font-bold text-sm uppercase">
                        Destination
                      </span>
                      <span className="material-symbols-outlined text-sm">
                        webhook
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="font-bold text-sm mb-2">Send Webhook</p>
                      <div className="text-xs font-mono text-green-600">
                        POST /api/v1/ingest
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
      <section className="py-16 px-6 border-b-4 border-black bg-white animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-black/10">
          <ScrollReveal delay="0.1s">
            <div className="flex flex-col gap-2 p-4">
              <span className="text-6xl font-black tracking-tighter">
                99.9%
              </span>
              <span className="text-sm uppercase font-bold tracking-widest bg-primary inline-block mx-auto px-2">
                Accuracy Rate
              </span>
            </div>
          </ScrollReveal>
          <ScrollReveal delay="0.3s">
            <div className="flex flex-col gap-2 p-4">
              <span className="text-6xl font-black tracking-tighter">
                250M+
              </span>
              <span className="text-sm uppercase font-bold tracking-widest bg-primary inline-block mx-auto px-2">
                Docs Processed
              </span>
            </div>
          </ScrollReveal>
          <ScrollReveal delay="0.5s">
            <div className="flex flex-col gap-2 p-4">
              <span className="text-6xl font-black tracking-tighter">
                &lt;2s
              </span>
              <span className="text-sm uppercase font-bold tracking-widest bg-primary inline-block mx-auto px-2">
                Avg Latency
              </span>
            </div>
          </ScrollReveal>
        </div>
      </section>
      <section className="px-6 py-20 max-w-7xl mx-auto text-center animate-fade-in">
        <ScrollReveal>
          <div className="flex flex-col gap-6 items-center bg-white border-[3px] border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-3xl md:text-6xl font-black uppercase tracking-tighter">
              Ready to Scale?
            </h2>
            <p className="text-xl font-medium max-w-lg">
              Join 5,000+ companies automating their data entry with
              DocXTractor.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-6 w-full justify-center max-w-md">
              <input
                className="bg-gray-50 border-[3px] border-black px-4 py-3 text-lg font-bold w-full focus:ring-0 focus:outline-none focus:bg-white transition-colors placeholder:text-gray-400"
                placeholder="work@email.com"
                type="email"
              />
              <button className="bg-primary border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-6 py-3 text-lg font-black uppercase hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all whitespace-nowrap cursor-pointer">
                Get Access
              </button>
            </div>
          </div>
        </ScrollReveal>
      </section>
      <footer className="border-t-4 border-black bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="flex flex-col gap-6 max-w-xs">
            <div className="flex items-center gap-2">
              <div className="bg-black text-white p-1">
                <span className="material-symbols-outlined font-bold block">
                  grid_view
                </span>
              </div>
              <h1 className="text-xl font-bold tracking-tight uppercase">
                DocXTractor
              </h1>
            </div>
            <p className="font-medium text-sm text-gray-600">
              The new standard for industrial document processing. Minimalist,
              fast, and developer-friendly.
            </p>
            <p className="font-bold text-xs uppercase mt-4">
              © 2024 DocXTractor Inc.
            </p>
          </div>
          <div className="flex gap-12 md:gap-24">
            <div className="flex flex-col gap-4">
              <h4 className="font-black uppercase text-sm tracking-wider border-b-2 border-primary inline-block">
                Product
              </h4>
              <a
                className="font-bold text-sm hover:text-primary hover:underline transition-colors"
                href="#"
              >
                Features
              </a>
              <a
                className="font-bold text-sm hover:text-primary hover:underline transition-colors"
                href="#"
              >
                Integrations
              </a>
              <a
                className="font-bold text-sm hover:text-primary hover:underline transition-colors"
                href="#"
              >
                Pricing
              </a>
              <a
                className="font-bold text-sm hover:text-primary hover:underline transition-colors"
                href="#"
              >
                Changelog
              </a>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="font-black uppercase text-sm tracking-wider border-b-2 border-primary inline-block">
                Resources
              </h4>
              <a
                className="font-bold text-sm hover:text-primary hover:underline transition-colors"
                href="#"
              >
                Documentation
              </a>
              <a
                className="font-bold text-sm hover:text-primary hover:underline transition-colors"
                href="#"
              >
                API Reference
              </a>
              <a
                className="font-bold text-sm hover:text-primary hover:underline transition-colors"
                href="#"
              >
                Community
              </a>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="font-black uppercase text-sm tracking-wider border-b-2 border-primary inline-block">
                Legal
              </h4>
              <a
                className="font-bold text-sm hover:text-primary hover:underline transition-colors"
                href="#"
              >
                Privacy
              </a>
              <a
                className="font-bold text-sm hover:text-primary hover:underline transition-colors"
                href="#"
              >
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
