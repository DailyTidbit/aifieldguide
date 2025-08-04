// src/app/hooks/useFieldGuide.ts
import { useState, useEffect } from 'react'
import { FieldGuideAPI } from '../lib/field-guide-api'
import { FieldGuideSection, AITool } from '../lib/field-guide-types'

export function useFieldGuide() {
  const [sections, setSections] = useState<FieldGuideSection[]>([])
  const [totalTools, setTotalTools] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [sectionsData, toolsCount] = await Promise.all([
          FieldGuideAPI.getAllSections(),
          FieldGuideAPI.getAllToolsCount()
        ])
        setSections(sectionsData)
        setTotalTools(toolsCount)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return { sections, totalTools, loading }
}

export function useSection(slug: string) {
  const [section, setSection] = useState<FieldGuideSection | null>(null)
  const [tools, setTools] = useState<AITool[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSection() {
      try {
        const sectionData = await FieldGuideAPI.getSectionBySlug(slug)
        if (sectionData) {
          setSection(sectionData)
          const toolsData = await FieldGuideAPI.getToolsForSection(sectionData.section_name)
          setTools(toolsData)
        }
      } finally {
        setLoading(false)
      }
    }
    if (slug) {
      loadSection()
    }
  }, [slug])

  return { section, tools, loading }
}