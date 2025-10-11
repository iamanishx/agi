"use client"
import { motion, AnimatePresence } from "framer-motion"
import { PanelLeftClose, PanelLeftOpen, SearchIcon, Plus, Settings, Asterisk } from "lucide-react"
import ConversationRow from "./ConversationRow"
import ThemeToggle from "./ThemeToggle"
import SearchModal from "./SearchModal"
import SettingsPopover from "./SettingsPopover"
import { cls } from "./utils"
import { useState } from "react"

export default function Sidebar({
  open,
  onClose,
  theme,
  setTheme,
  collapsed,
  setCollapsed,
  conversations,
  pinned,
  recent,
  folders,
  folderCounts,
  selectedId,
  onSelect,
  togglePin,
  query,
  setQuery,
  searchRef,
  createFolder,
  createNewChat,
  templates = [],
  setTemplates = () => {},
  onUseTemplate = () => {},
  sidebarCollapsed = false,
  setSidebarCollapsed = () => {},
}) {
  const [showSearchModal, setShowSearchModal] = useState(false)

  if (sidebarCollapsed) {
    return (
      <motion.aside
        initial={{ width: 320 }}
        animate={{ width: 64 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="z-50 flex h-full shrink-0 flex-col border-r border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="flex items-center justify-center border-b border-zinc-200/60 px-3 py-3 dark:border-zinc-800">
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="rounded-xl p-2 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-zinc-800"
            aria-label="Open sidebar"
            title="Open sidebar"
          >
            <PanelLeftOpen className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 pt-4">
          <button
            onClick={createNewChat}
            className="rounded-xl p-2 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-zinc-800"
            title="New Chat"
          >
            <Plus className="h-5 w-5" />
          </button>

          <button
            onClick={() => setShowSearchModal(true)}
            className="rounded-xl p-2 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-zinc-800"
            title="Search"
          >
            <SearchIcon className="h-5 w-5" />
          </button>

          <div className="mt-auto mb-4">
            <SettingsPopover>
              <button
                className="rounded-xl p-2 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-zinc-800"
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </button>
            </SettingsPopover>
          </div>
        </div>
      </motion.aside>
    )
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(open || typeof window !== "undefined") && (
          <motion.aside
            key="sidebar"
            initial={{ x: -340 }}
            animate={{ x: open ? 0 : 0 }}
            exit={{ x: -340 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className={cls(
              "z-50 flex h-full w-80 shrink-0 flex-col border-r border-zinc-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900",
              "fixed inset-y-0 left-0 md:static md:translate-x-0",
            )}
          >
            <div className="flex items-center gap-2 border-b border-zinc-200/60 px-3 py-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-sm dark:from-zinc-200 dark:to-zinc-300 dark:text-zinc-900">
                  <Asterisk className="h-4 w-4" />
                </div>
                <div className="text-sm font-semibold tracking-tight">AI Assistant</div>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="hidden md:block rounded-xl p-2 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-zinc-800"
                  aria-label="Close sidebar"
                  title="Close sidebar"
                >
                  <PanelLeftClose className="h-5 w-5" />
                </button>

                <button
                  onClick={onClose}
                  className="md:hidden rounded-xl p-2 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-zinc-800"
                  aria-label="Close sidebar"
                >
                  <PanelLeftClose className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="px-3 pt-3">
              <label htmlFor="search" className="sr-only">
                Search conversations
              </label>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  id="search"
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search…"
                  onClick={() => setShowSearchModal(true)}
                  onFocus={() => setShowSearchModal(true)}
                  className="w-full rounded-full border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950/50"
                />
              </div>
            </div>

            <div className="px-3 pt-3">
              <button
                onClick={createNewChat}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-white dark:text-zinc-900"
                title="New Chat (⌘N)"
              >
                <Plus className="h-4 w-4" /> Start New Chat
              </button>
            </div>

            <nav className="mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-2 pb-4">
              <div>
                <div className="px-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">CHATS</div>
                <div className="mt-2 flex flex-col">
                  {conversations
                    .slice()
                    .sort((a, b) => {
                      if (a.pinned === b.pinned) {
                        return a.updatedAt < b.updatedAt ? 1 : -1
                      }
                      return a.pinned ? -1 : 1
                    })
                    .map((c) => (
                      <ConversationRow
                        key={c.id}
                        data={c}
                        active={c.id === selectedId}
                        onSelect={() => onSelect(c.id)}
                        onTogglePin={() => togglePin(c.id)}
                        showMeta
                      />
                    ))}
                </div>
              </div>
            </nav>

            <div className="mt-auto border-t border-zinc-200/60 px-3 py-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <SettingsPopover>
                  <button className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-zinc-800">
                    <Settings className="h-4 w-4" /> Settings
                  </button>
                </SettingsPopover>
                <div className="ml-auto">
                  <ThemeToggle theme={theme} setTheme={setTheme} />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 rounded-xl bg-zinc-50 p-2 dark:bg-zinc-800/60">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-white dark:text-zinc-900">
                  JD
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">John Doe</div>
                  <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">Pro workspace</div>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        conversations={conversations}
        selectedId={selectedId}
        onSelect={onSelect}
        togglePin={togglePin}
        createNewChat={createNewChat}
      />
    </>
  )
}
