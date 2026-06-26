/**
 * NEET Physics curriculum — Class XI / XII chapter architecture.
 * Maps bank `topic` values to the NCERT physics syllabus tree.
 */
(function (global) {
  const CHAPTER_ALIASES = {
    'waves': 'Waves',
    'Semiconductor Electronics Materials, Devices and Simple Circuits': 'Semiconductor Electronics',
    'Systems of Particles and Rotational Motion': 'System of Particles and Rotational Motion',
    // HC Verma (Concepts of Physics) chapter names -> NCERT NEET chapters
    'Chapter 1: Introduction to Physics': 'Units and Measurement',
    'Chapter 2: Physics and Mathematics': 'Units and Measurement',
    'Chapter 3: Rest and Motion: Kinematics': 'Motion in a Straight Line',
    'Chapter 4: The Forces': 'Laws of Motion',
    "Chapter 5: Newton's Laws of Motion": 'Laws of Motion',
    'Chapter 6: Friction': 'Laws of Motion',
    'Chapter 7: Circular Motion': 'Motion in a Plane',
    'Chapter 8: Work and Energy': 'Work, Energy and Power',
    'Chapter 9: Centre of Mass, Linear Momentum, Collision': 'System of Particles and Rotational Motion',
    'Chapter 10: Rotational Mechanics': 'System of Particles and Rotational Motion',
    'Chapter 11: Gravitation': 'Gravitation',
    'Chapter 12: Simple Harmonic Motion': 'Oscillations',
    'Chapter 13: Fluid Mechanics': 'Mechanical Properties of Fluids',
    'Chapter 14: Some Mechanical Properties of Matter': 'Mechanical Properties of Solids',
    'Chapter 15: Wave Motion and Waves on a String': 'Waves',
    'Chapter 16: Sound Waves': 'Waves',
    'Chapter 17: Light Waves': 'Wave Optics',
    'Chapter 18: Geometrical Optics': 'Ray Optics and Optical Instruments',
    'Chapter 19: Optical Instruments': 'Ray Optics and Optical Instruments',
    'Chapter 20: Dispersion and Spectra': 'Ray Optics and Optical Instruments',
    'Chapter 21: Speed of Light': 'Electromagnetic Waves',
    'Chapter 22: Photometry': 'Ray Optics and Optical Instruments',
    'Chapter 23: Heat and Temperature': 'Thermal Properties of Matter',
    'Chapter 24: Kinetic Theory of Gases': 'Kinetic Theory',
    'Chapter 25: Calorimetry': 'Thermal Properties of Matter',
    'Chapter 26: Laws of Thermodynamics': 'Thermodynamics',
    'Chapter 27: Specific Heat Capacities of Gases': 'Kinetic Theory',
    'Chapter 28: Heat Transfer': 'Thermal Properties of Matter',
    'Chapter 29: Electric Field and Potential': 'Electric Charges and Fields',
    "Chapter 30: Gauss's Law": 'Electric Charges and Fields',
    'Chapter 31: Capacitors': 'Electrostatic Potential and Capacitance',
    'Chapter 32: Electric Current in Conductors': 'Current Electricity',
    'Chapter 33: Thermal and Chemical Effects of Electric Current': 'Current Electricity',
    'Chapter 34: Magnetic Field': 'Moving Charges and Magnetism',
    'Chapter 35: Magnetic Field due to a Current': 'Moving Charges and Magnetism',
    'Chapter 36: Permanent Magnets': 'Magnetism and Matter',
    'Chapter 37: Magnetic Properties of Matter': 'Magnetism and Matter',
    'Chapter 38: Electromagnetic Induction': 'Electromagnetic Induction',
    'Chapter 39: Alternating Current': 'Alternating Current',
    'Chapter 40: Electromagnetic Waves': 'Electromagnetic Waves',
    'Chapter 41: Electric Current through Gases': 'Current Electricity',
    'Chapter 42: Photoelectric Effect and Wave-Particle Duality': 'Dual Nature of Radiation and Matter',
    "Chapter 43: Bohr's Model and Physics of the Atom": 'Atoms',
    'Chapter 44: X-rays': 'Atoms',
    'Chapter 45: Semiconductors and Semiconductor Devices': 'Semiconductor Electronics',
    'Chapter 46: The Nucleus': 'Nuclei'
  };

  const SECTION_TYPES = [
    { key: 'pyq', label: 'Previous Year (PYQ)', icon: '🎯' },
    { key: 'practice', label: 'Practice MCQs', icon: '📝' },
    { key: 'ncert', label: 'NCERT Exemplar', icon: '📘' }
  ];

  const CURRICULUM = [
    {
      id: 'xi',
      label: 'Class XI',
      subtitle: 'Mechanics, thermodynamics, waves & oscillations',
      units: [
        {
          id: 'xi-units',
          label: 'Unit I — Physical World & Measurement',
          chapters: ['Units and Measurement']
        },
        {
          id: 'xi-kinematics',
          label: 'Unit II — Kinematics',
          chapters: [
            'Motion in a Straight Line',
            'Motion in a Plane'
          ]
        },
        {
          id: 'xi-laws',
          label: 'Unit III — Laws of Motion',
          chapters: ['Laws of Motion']
        },
        {
          id: 'xi-work',
          label: 'Unit IV — Work, Energy & Power',
          chapters: ['Work, Energy and Power']
        },
        {
          id: 'xi-rotation',
          label: 'Unit V — Motion of Systems & Rigid Bodies',
          chapters: [
            'System of Particles and Rotational Motion',
            'Gravitation'
          ]
        },
        {
          id: 'xi-properties',
          label: 'Units VI & VII — Properties of Bulk Matter',
          chapters: [
            'Mechanical Properties of Solids',
            'Mechanical Properties of Fluids',
            'Thermal Properties of Matter'
          ]
        },
        {
          id: 'xi-thermo',
          label: 'Unit VIII — Thermodynamics',
          chapters: ['Thermodynamics']
        },
        {
          id: 'xi-kinetic',
          label: 'Unit IX — Behaviour of Perfect Gas',
          chapters: ['Kinetic Theory']
        },
        {
          id: 'xi-waves',
          label: 'Unit X — Oscillations & Waves',
          chapters: [
            'Oscillations',
            'Waves'
          ]
        }
      ]
    },
    {
      id: 'xii',
      label: 'Class XII',
      subtitle: 'Electrodynamics, optics, modern physics & electronics',
      units: [
        {
          id: 'xii-electrostatics',
          label: 'Unit I — Electrostatics',
          chapters: [
            'Electric Charges and Fields',
            'Electrostatic Potential and Capacitance'
          ]
        },
        {
          id: 'xii-current',
          label: 'Unit II — Current Electricity',
          chapters: ['Current Electricity']
        },
        {
          id: 'xii-magnetism',
          label: 'Units III & IV — Magnetic Effects & Magnetism',
          chapters: [
            'Moving Charges and Magnetism',
            'Magnetism and Matter'
          ]
        },
        {
          id: 'xii-emi',
          label: 'Unit V — Electromagnetic Induction & AC',
          chapters: [
            'Electromagnetic Induction',
            'Alternating Current'
          ]
        },
        {
          id: 'xii-em-waves',
          label: 'Unit VI — Electromagnetic Waves',
          chapters: ['Electromagnetic Waves']
        },
        {
          id: 'xii-optics',
          label: 'Unit VII — Optics',
          chapters: [
            'Ray Optics and Optical Instruments',
            'Wave Optics'
          ]
        },
        {
          id: 'xii-dual',
          label: 'Unit VIII — Dual Nature of Radiation',
          chapters: ['Dual Nature of Radiation and Matter']
        },
        {
          id: 'xii-atoms',
          label: 'Unit IX — Atoms & Nuclei',
          chapters: [
            'Atoms',
            'Nuclei'
          ]
        },
        {
          id: 'xii-semi',
          label: 'Unit X — Semiconductor Electronics',
          chapters: ['Semiconductor Electronics']
        },
        {
          id: 'xii-exp',
          label: 'Unit XI — Experimental Skills',
          chapters: ['Experimental Skills']
        }
      ]
    }
  ];

  function normalizeChapter(topic) {
    const value = (topic || '').trim();
    return CHAPTER_ALIASES[value] || value;
  }

  function normalizeSection(subtopic) {
    const raw = (subtopic || '').trim().toLowerCase();
    if (!raw || raw === 'practice') return 'practice';
    if (raw === 'pyq' || raw.includes('previous')) return 'pyq';
    if (raw.includes('ncert') || raw.includes('exemplar')) return 'ncert';
    if (raw.includes('assertion')) return 'assertion';
    // Physics: subtopic names are actual NCERT section names → treat as PYQ context
    return 'other';
  }

  function sectionLabel(sectionKey) {
    const match = SECTION_TYPES.find(item => item.key === sectionKey);
    return match ? match.label : 'Topic-wise';
  }

  function buildQuestionIndex(questions) {
    const byChapter = new Map();

    questions.forEach(question => {
      const chapter = normalizeChapter(question.topic);
      if (!byChapter.has(chapter)) {
        byChapter.set(chapter, { total: 0, sections: new Map(), questions: [] });
      }
      const bucket = byChapter.get(chapter);
      bucket.total += 1;
      bucket.questions.push(question);

      const section = normalizeSection(question.subtopic);
      bucket.sections.set(section, (bucket.sections.get(section) || 0) + 1);
    });

    return byChapter;
  }

  function buildCurriculumTree(questions, getStatus) {
    const index = buildQuestionIndex(questions);

    return CURRICULUM.map(year => ({
      ...year,
      units: year.units.map(unit => ({
        ...unit,
        chapters: unit.chapters.map(chapterName => {
          const bucket = index.get(chapterName) || { total: 0, sections: new Map(), questions: [] };
          let mastered = 0;
          let attempted = 0;
          let wrong = 0;
          let unsolved = 0;

          bucket.questions.forEach(q => {
            const status = getStatus(q.id);
            if (status === 'unsolved') unsolved += 1;
            else attempted += 1;
            if (status === 'mastered') mastered += 1;
            if (status === 'wrong') wrong += 1;
          });

          const sections = SECTION_TYPES.map(type => ({
            ...type,
            count: bucket.sections.get(type.key) || 0,
            questions: bucket.questions.filter(q => normalizeSection(q.subtopic) === type.key)
          })).filter(s => s.count > 0);

          const otherCount = bucket.sections.get('other') || 0;
          if (otherCount) {
            sections.push({
              key: 'other',
              label: 'Topic-wise PYQ',
              icon: '⚛️',
              count: otherCount,
              questions: bucket.questions.filter(q => normalizeSection(q.subtopic) === 'other')
            });
          }

          const coverage = bucket.total ? Math.round((mastered / bucket.total) * 100) : 0;
          const progress = bucket.total ? Math.round((attempted / bucket.total) * 100) : 0;

          return {
            id: chapterName,
            name: chapterName,
            total: bucket.total,
            attempted,
            mastered,
            wrong,
            unsolved,
            coverage,
            progress,
            sections,
            inBank: bucket.total > 0
          };
        })
      }))
    }));
  }

  function findChapter(tree, chapterName) {
    const normalized = normalizeChapter(chapterName);
    for (const year of tree) {
      for (const unit of year.units) {
        const chapter = unit.chapters.find(item => item.name === normalized);
        if (chapter) return { year, unit, chapter };
      }
    }
    return null;
  }

  // chapter name -> { class, classLabel, unitId, unitLabel, order }
  const CHAPTER_INFO = {};
  let _order = 0;
  CURRICULUM.forEach(year => {
    year.units.forEach(unit => {
      unit.chapters.forEach(ch => {
        CHAPTER_INFO[ch] = {
          class: year.id === 'xi' ? 'XI' : 'XII',
          classLabel: year.label,
          unitId: unit.id,
          unitLabel: unit.label,
          order: _order++
        };
      });
    });
  });

  function getChapterInfo(chapterName) {
    return CHAPTER_INFO[normalizeChapter(chapterName)] || null;
  }

  global.NeetCurriculum = {
    CURRICULUM,
    CHAPTER_INFO,
    SECTION_TYPES,
    normalizeChapter,
    normalizeSection,
    sectionLabel,
    getChapterInfo,
    buildQuestionIndex,
    buildCurriculumTree,
    findChapter
  };
})(window);
