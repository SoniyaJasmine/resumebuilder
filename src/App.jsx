
import { useState } from 'react'
import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'

function App() {

  // 1. Main resume data
  const [resumeData, setResumeData] = useState({
    personalInfo: {
      name: '',
      email: '',
      phone: ''
    },

    education: [
      {
        schoolName: '',
        degree: '',
        graduationYear: ''
      }
    ],

    experience: [
      {
        jobTitle: '',
        company: '',
        startDate: '',
        endDate: '',
        responsibilities: ''
      }
    ]
  })

  // 2. Skills states
  const [skills, setSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [suggestedSkills, setSuggestedSkills] = useState([])
  const [summaryInput, setSummaryInput] = useState('')
  const [resumeSummary, setResumeSummary] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState('')
  const [exportError, setExportError] = useState('')

  // 3. AI loading and error states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 4. Update personal information
  const updatePersonalInfo = (field, value) => {
    setResumeData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }))
  }

  // 5. Update education
  const updateEducation = (index, field, value) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  // 6. Add education
  const addEducation = () => {
    setResumeData(prev => ({
      ...prev,
      education: [
        ...prev.education,
        {
          schoolName: '',
          degree: '',
          graduationYear: ''
        }
      ]
    }))
  }

  // 7. Remove education
  const removeEducation = (index) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }))
  }

  // 8. Update experience
  const updateExperience = (index, field, value) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  // 9. Add experience
  const addExperience = () => {
    setResumeData(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          jobTitle: '',
          company: '',
          startDate: '',
          endDate: '',
          responsibilities: ''
        }
      ]
    }))
  }

  // 10. Remove experience
  const removeExperience = (index) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }))
  }

  // 11. Add skill
  const addSkill = () => {
    const newSkill = skillInput.trim()

    if (
      newSkill &&
      !skills.some(skill => skill.toLowerCase() === newSkill.toLowerCase())
    ) {
      setSkills(prev => [...prev, newSkill])
      setSkillInput('')
    }
  }

  // 12. Remove skill
  const removeSkill = (index) => {
    setSkills(prev => prev.filter((_, i) => i !== index))
  }

  const generateSummary = async (keywords) => {
    if (!keywords.trim()) {
      setSummaryError('Enter keywords or your professional background first.')
      return
    }

    setSummaryLoading(true)
    setSummaryError('')

    try {
      const response = await fetch('/api/professional-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keywords
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to generate summary')
      }

      setResumeSummary(data.summary)
    } catch (err) {
      console.error('Summary generation error:', err)
      setSummaryError(err.message || 'Unable to generate summary')
    } finally {
      setSummaryLoading(false)
    }
  }

  // 13. Fetch AI skill suggestions
  const fetchSuggestions = async () => {
    setLoading(true)
    setError('')

    try {
      const API_URL = import.meta.env.VITE_API_URL || ''

      const response = await fetch(`${API_URL}/api/skill-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: 'Software Developer'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to fetch suggestions')
      }

      setSuggestedSkills(data.suggestions || [])

    } catch (err) {
      console.error('AI Error:', err)
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // 14. Add suggested skill to skills list
  const addSuggestedSkill = (skill) => {
    if (
      !skills.some(item => item.toLowerCase() === skill.toLowerCase())
    ) {
      setSkills(prev => [...prev, skill])
    }
  }

  const handleExportPDF = async () => {
    setExportError('')

    try {
      const doc = new jsPDF()
      const margin = 18
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      let y = 20

      const ensureSpace = (height) => {
        if (y + height > pageHeight - margin) {
          doc.addPage()
          y = margin
        }
      }

      const addParagraph = (text, fontSize = 10, fontStyle = 'normal') => {
        if (!text) return

        doc.setFont('helvetica', fontStyle)
        doc.setFontSize(fontSize)
        const lines = doc.splitTextToSize(text, pageWidth - margin * 2)
        const lineHeight = fontSize * 0.5

        lines.forEach(line => {
          ensureSpace(lineHeight)
          doc.text(line, margin, y)
          y += lineHeight
        })
      }

      const addSectionHeading = (title) => {
        ensureSpace(14)
        y += 4
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.setTextColor(67, 56, 202)
        doc.text(title, margin, y)
        y += 2
        doc.setDrawColor(209, 213, 219)
        doc.line(margin, y, pageWidth - margin, y)
        y += 6
        doc.setTextColor(31, 41, 55)
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(20)
      const nameLines = doc.splitTextToSize(
        resumeData.personalInfo.name || 'Your Name',
        pageWidth - margin * 2
      )
      ensureSpace(nameLines.length * 10)
      doc.text(
        nameLines,
        pageWidth / 2,
        y,
        { align: 'center' }
      )
      y += Math.max(9, nameLines.length * 10)

      const contactInfo = [
        resumeData.personalInfo.email,
        resumeData.personalInfo.phone
      ].filter(Boolean).join(' | ')
      if (contactInfo) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        const contactLines = doc.splitTextToSize(
          contactInfo,
          pageWidth - margin * 2
        )
        contactLines.forEach(line => {
          ensureSpace(6)
          doc.text(line, pageWidth / 2, y, { align: 'center' })
          y += 6
        })
      }

      addSectionHeading('Summary')
      addParagraph(resumeSummary || 'No professional summary added.')

      addSectionHeading('Experience')
      const experienceRows = resumeData.experience
        .filter(item =>
          [item.jobTitle, item.company, item.startDate, item.endDate, item.responsibilities]
            .some(value => value.trim())
        )
        .map(item => [
          [item.jobTitle, item.company].filter(Boolean).join('\n'),
          [item.startDate, item.endDate].filter(Boolean).join(' - '),
          item.responsibilities
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean)
            .map(line => `- ${line}`)
            .join('\n')
        ])

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Position / Company', 'Dates', 'Responsibilities / Achievements']],
        body: experienceRows.length > 0
          ? experienceRows
          : [['No experience added.', '', '']],
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
        headStyles: { fillColor: [67, 56, 202] },
        columnStyles: {
          0: { cellWidth: 48 },
          1: { cellWidth: 35 },
          2: { cellWidth: 'auto' }
        }
      })
      y = doc.lastAutoTable.finalY + 8

      addSectionHeading('Education')
      const educationRows = resumeData.education
        .filter(item =>
          [item.schoolName, item.degree, item.graduationYear]
            .some(value => value.trim())
        )
        .map(item => [item.schoolName, item.degree, item.graduationYear])

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['School / College', 'Degree', 'Graduation Year']],
        body: educationRows.length > 0
          ? educationRows
          : [['No education added.', '', '']],
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
        headStyles: { fillColor: [67, 56, 202] }
      })
      y = doc.lastAutoTable.finalY + 8

      addSectionHeading('Skills')
      addParagraph(skills.join(', ') || 'No skills added.')

      const filename = (resumeData.personalInfo.name || 'resume')
        .trim()
        .replace(/[^\w-]+/g, '_')
      doc.save(`${filename || 'resume'}.pdf`)
    } catch (err) {
      console.error('PDF export error:', err)
      setExportError(err.message || 'Unable to export the resume as a PDF.')
    }
  }

  // Reusable input styling
  const inputStyle =
    "w-full border border-gray-300 rounded-lg px-4 py-3 mt-2 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"

  const sectionStyle =
    "bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6"

  const headingStyle =
    "text-xl font-bold text-gray-800 mb-5"

  const labelStyle =
    "text-sm font-medium text-gray-600"

  const buttonStyle =
    "bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg transition"

  const addButtonStyle =
    "text-indigo-600 border border-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg text-sm font-medium"

  const removeButtonStyle =
    "text-red-500 hover:text-red-700 text-sm font-medium"

  return (
    <main className="min-h-screen bg-slate-100 py-10 px-4">

      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-indigo-700">
            Resume Builder
          </h1>

          <p className="text-gray-500 mt-2">
            Build your professional resume with AI assistance
          </p>
        </header>

        {/* Personal Information */}
        <section className={sectionStyle}>

          <h2 className={headingStyle}>
            01. Personal Information
          </h2>

          <div className="grid md:grid-cols-2 gap-5">

            <div className="md:col-span-2">
              <label className={labelStyle}>Full Name</label>

              <input
                type="text"
                placeholder="Enter your full name"
                className={inputStyle}
                value={resumeData.personalInfo.name}
                onChange={(e) =>
                  updatePersonalInfo('name', e.target.value)
                }
              />
            </div>

            <div>
              <label className={labelStyle}>Email</label>

              <input
                type="email"
                placeholder="example@gmail.com"
                className={inputStyle}
                value={resumeData.personalInfo.email}
                onChange={(e) =>
                  updatePersonalInfo('email', e.target.value)
                }
              />
            </div>

            <div>
              <label className={labelStyle}>Phone</label>

              <input
                type="tel"
                placeholder="Enter phone number"
                className={inputStyle}
                value={resumeData.personalInfo.phone}
                onChange={(e) =>
                  updatePersonalInfo('phone', e.target.value)
                }
              />
            </div>

          </div>
        </section>

        {/* Education */}
        <section className={sectionStyle}>

          <h2 className={headingStyle}>
            02. Education
          </h2>

          {resumeData.education.map((item, index) => (

            <div
              key={index}
              className="border border-gray-200 p-5 rounded-lg mb-5"
            >

              <div className="flex justify-between items-center mb-4">

                <h3 className="font-semibold text-gray-700">
                  Education {index + 1}
                </h3>

                <button
                  type="button"
                  className={removeButtonStyle}
                  onClick={() => removeEducation(index)}
                >
                  Remove
                </button>

              </div>

              <div className="grid md:grid-cols-2 gap-4">

                <div>
                  <label className={labelStyle}>School / College</label>

                  <input
                    type="text"
                    placeholder="School or college name"
                    className={inputStyle}
                    value={item.schoolName}
                    onChange={(e) =>
                      updateEducation(index, 'schoolName', e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className={labelStyle}>Degree</label>

                  <input
                    type="text"
                    placeholder="e.g. B.Sc Mathematics"
                    className={inputStyle}
                    value={item.degree}
                    onChange={(e) =>
                      updateEducation(index, 'degree', e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className={labelStyle}>Graduation Year</label>

                  <input
                    type="text"
                    placeholder="e.g. 2023"
                    className={inputStyle}
                    value={item.graduationYear}
                    onChange={(e) =>
                      updateEducation(index, 'graduationYear', e.target.value)
                    }
                  />
                </div>

              </div>

            </div>

          ))}

          <button
            type="button"
            className={addButtonStyle}
            onClick={addEducation}
          >
            + Add Education
          </button>

        </section>

        {/* Experience */}
        <section className={sectionStyle}>

          <h2 className={headingStyle}>
            03. Work Experience
          </h2>

          {resumeData.experience.map((item, index) => (

            <div
              key={index}
              className="border border-gray-200 p-5 rounded-lg mb-5"
            >

              <div className="flex justify-between items-center mb-4">

                <h3 className="font-semibold text-gray-700">
                  Experience {index + 1}
                </h3>

                <button
                  type="button"
                  className={removeButtonStyle}
                  onClick={() => removeExperience(index)}
                >
                  Remove
                </button>

              </div>

              <div className="grid md:grid-cols-2 gap-4">

                <div>
                  <label className={labelStyle}>Job Title</label>

                  <input
                    type="text"
                    placeholder="e.g. Software Developer"
                    className={inputStyle}
                    value={item.jobTitle}
                    onChange={(e) =>
                      updateExperience(index, 'jobTitle', e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className={labelStyle}>Company</label>

                  <input
                    type="text"
                    placeholder="Company name"
                    className={inputStyle}
                    value={item.company}
                    onChange={(e) =>
                      updateExperience(index, 'company', e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className={labelStyle}>Start Date</label>

                  <input
                    type="date"
                    className={inputStyle}
                    value={item.startDate}
                    onChange={(e) =>
                      updateExperience(index, 'startDate', e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className={labelStyle}>End Date</label>

                  <input
                    type="date"
                    className={inputStyle}
                    value={item.endDate}
                    onChange={(e) =>
                      updateExperience(index, 'endDate', e.target.value)
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelStyle}>Responsibilities / Achievements</label>

                  <textarea
                    placeholder="Add one responsibility or achievement per line"
                    className={inputStyle}
                    rows={3}
                    value={item.responsibilities}
                    onChange={(e) =>
                      updateExperience(index, 'responsibilities', e.target.value)
                    }
                  />
                </div>

              </div>

            </div>

          ))}

          <button
            type="button"
            className={addButtonStyle}
            onClick={addExperience}
          >
            + Add Experience
          </button>

        </section>

        {/* Skills */}
        <section className={sectionStyle}>

          <h2 className={headingStyle}>
            04. Skills
          </h2>

          <div className="flex flex-col sm:flex-row gap-3">

            <input
              type="text"
              placeholder="Enter a skill (e.g. Python)"
              className={inputStyle + " mt-0"}
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addSkill()
                }
              }}
            />

            <button
              type="button"
              className={buttonStyle}
              onClick={addSkill}
            >
              Add Skill
            </button>

          </div>

          {/* Added Skills */}
          <div className="flex flex-wrap gap-3 mt-5">

            {skills.map((skill, index) => (

              <div
                key={index}
                className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full flex items-center gap-3"
              >
                <span>{skill}</span>

                <button
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="text-red-500 font-bold"
                  aria-label={`Remove ${skill}`}
                >
                  ×
                </button>

              </div>

            ))}

          </div>

        </section>

        {/* Professional Summary */}
        <section className={sectionStyle}>
          <h2 className={headingStyle}>
            Professional Summary
          </h2>
          <label className={labelStyle} htmlFor="summary-keywords">
            Enter keywords or a brief professional background to base the
            summary on.
          </label>
          <div className="flex flex-col sm:flex-row gap-3 items-start">
            <textarea
              id="summary-keywords"
              className={inputStyle}
              rows={4}
              maxLength={2000}
              placeholder="e.g. Frontend developer, 3 years of experience, React, accessible UI, mentoring"
              value={summaryInput}
              onChange={(e) => setSummaryInput(e.target.value)}
            />
            <button
              type="button"
              className={buttonStyle + " shrink-0"}
              onClick={() => generateSummary(summaryInput)}
              disabled={summaryLoading}
            >
              {summaryLoading ? 'Generating...' : 'Generate Summary'}
            </button>
          </div>

          {summaryLoading && (
            <p className="text-indigo-600 text-sm mt-2">
              Generating your professional summary...
            </p>
          )}
          {summaryError && (
            <p className="text-red-500 text-sm mt-2">
              {summaryError}
            </p>
          )}
          {resumeSummary && (
            <p className="text-gray-700 leading-relaxed mt-4">
              {resumeSummary}
            </p>
          )}
        </section>

        {/* AI Suggestions */}
        <section className={sectionStyle}>

          <div className="flex flex-wrap justify-between items-center gap-3 mb-5">

            <h2 className={headingStyle + " mb-0"}>
              05. AI Skill Suggestions
            </h2>

            <button
              type="button"
              className={buttonStyle}
              onClick={fetchSuggestions}
              disabled={loading}
            >
              {loading
                ? 'Generating...'
                : suggestedSkills.length > 0
                  ? 'Refresh Suggestions'
                  : 'Generate Suggestions'}
            </button>

          </div>

          <p className="text-gray-500 text-sm mb-5">
            AI-powered professional skills recommended for software developers.
            Click any suggestion to add it to your skills.
          </p>

          {loading && (
            <p className="text-indigo-600">
              Generating suggestions...
            </p>
          )}

          {error && (
            <p className="text-red-500 text-sm mb-3">
              {error}
            </p>
          )}

          {!loading && !error && suggestedSkills.length === 0 && (
            <p className="text-gray-500 text-sm">
              Generate suggestions when you are ready.
            </p>
          )}

          {!loading && suggestedSkills.length > 0 && (

            <div className="flex flex-wrap gap-3">

              {suggestedSkills.map((skill, index) => (

                <button
                  type="button"
                  key={index}
                  onClick={() => addSuggestedSkill(skill)}
                  disabled={skills.some(
                    item => item.toLowerCase() === skill.toLowerCase()
                  )}
                  className="border border-indigo-200 text-indigo-700 px-4 py-2 rounded-full hover:bg-indigo-600 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  + {skill}
                </button>

              ))}

            </div>

          )}

        </section>

        {/* Resume Preview */}
        <section className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="flex justify-end mb-5">
            <button
              type="button"
              className={buttonStyle}
              onClick={handleExportPDF}
            >
              Export to PDF
            </button>
          </div>
          {exportError && (
            <p className="text-red-500 text-sm mb-3" role="alert">
              {exportError}
            </p>
          )}

          <h2 className="text-center text-2xl font-bold text-gray-900">
            {resumeData.personalInfo.name || 'Your Name'}
          </h2>
          <p className="text-center text-sm text-gray-600 mt-2">
            {[resumeData.personalInfo.email, resumeData.personalInfo.phone]
              .filter(Boolean)
              .join('  |  ') || 'Email | Phone'}
          </p>

          <div className="mt-8 space-y-6">
            <section className="border-t border-gray-200 pt-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-700 mb-2">
                Summary
              </h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {resumeSummary || 'Generate a professional summary to display it here.'}
              </p>
            </section>

            <section className="border-t border-gray-200 pt-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-700 mb-3">
                Experience
              </h3>
              <div className="space-y-4">
                {resumeData.experience
                  .filter(item =>
                    [item.jobTitle, item.company, item.startDate, item.endDate, item.responsibilities]
                      .some(value => value.trim())
                  )
                  .map((item, index) => (
                    <div key={index}>
                      <div className="flex flex-wrap justify-between gap-2">
                        <p className="font-bold text-gray-900">
                          {[item.jobTitle, item.company].filter(Boolean).join(' | ')}
                        </p>
                        {(item.startDate || item.endDate) && (
                          <p className="text-sm text-gray-600">
                            {[item.startDate, item.endDate].filter(Boolean).join(' - ')}
                          </p>
                        )}
                      </div>
                      {item.responsibilities.trim() && (
                        <ul className="list-disc pl-5 mt-2 text-sm text-gray-700 space-y-1">
                          {item.responsibilities
                            .split('\n')
                            .map(line => line.trim())
                            .filter(Boolean)
                            .map((responsibility, responsibilityIndex) => (
                              <li key={responsibilityIndex}>{responsibility}</li>
                            ))}
                        </ul>
                      )}
                    </div>
                  ))}
              </div>
            </section>

            <section className="border-t border-gray-200 pt-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-700 mb-3">
                Education
              </h3>
              <div className="space-y-3">
                {resumeData.education
                  .filter(item =>
                    [item.schoolName, item.degree, item.graduationYear]
                      .some(value => value.trim())
                  )
                  .map((item, index) => (
                    <div key={index} className="flex flex-wrap justify-between gap-2">
                      <div>
                        {item.schoolName && (
                          <p className="font-bold text-gray-900">{item.schoolName}</p>
                        )}
                        {item.degree && (
                          <p className="text-sm text-gray-700">{item.degree}</p>
                        )}
                      </div>
                      {item.graduationYear && (
                        <p className="text-sm text-gray-600">{item.graduationYear}</p>
                      )}
                    </div>
                  ))}
              </div>
            </section>

            <section className="border-t border-gray-200 pt-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-700 mb-3">
                Skills
              </h3>
              <p className="text-gray-700">
                {skills.join(', ') || 'Add skills to display them here.'}
              </p>
            </section>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-gray-400 text-sm py-5">
          Resume Builder | React + Tailwind CSS + Gemini AI
        </footer>

      </div>

    </main>
  )
}

export default App
