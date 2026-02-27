// scripts/price-editor/main.go
package main

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

// ── Data ──────────────────────────────────────────────────────────────────────

type PriceEntry struct {
	Key   string
	Value float64
}

var defaultPrices = []PriceEntry{
	{"XL_UPPER_WINDOW", 23.64},
	{"L_UPPER_WINDOW", 16.06},
	{"M_UPPER_WINDOW", 8.59},
	{"S_UPPER_WINDOW", 6.85},
	{"XS_UPPER_WINDOW", 3.56},
	{"XL_LOWER_WINDOW", 17.98},
	{"L_LOWER_WINDOW", 11.43},
	{"M_LOWER_WINDOW", 6.49},
	{"S_LOWER_WINDOW", 4.31},
	{"XS_LOWER_WINDOW", 2.54},
	{"EXTERIOR_HALF_SCREEN", 2.72},
	{"WHOLE_INTERIOR_SCREEN", 3.12},
	{"EXTERIOR_HALF_SCREEN_INTERIOR", 4.0},
	{"SOLAR_SCREEN", 5.56},
	{"SCREW_SOLAR_SCREEN", 8.0},
	{"UPPER_WOODEN_SCREEN", 14.0},
	{"LOWER_WOODEN_SCREEN", 7.0},
	{"FIRST_STORY_GUTTER", 1.0},
	{"SECOND_STORY_GUTTER", 2.0},
}

const outputPath = "../../lib/prices.ts"

// ── Styles ────────────────────────────────────────────────────────────────────

var (
	titleStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(lipgloss.Color("12")).
			MarginBottom(1)

	cursorLineStyle = lipgloss.NewStyle().
			Background(lipgloss.Color("12")).
			Foreground(lipgloss.Color("0")).
			Bold(true)

	checkStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("10"))

	uncheckStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("8"))

	helpStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("8")).
			MarginTop(1)

	inputStyle = lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(lipgloss.Color("12")).
			Padding(0, 1).
			MarginTop(1)

	errorStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("9"))
)

// ── Model ─────────────────────────────────────────────────────────────────────

type stage int

const (
	stageSelect stage = iota
	stageInput
)

type model struct {
	prices   []PriceEntry
	selected map[int]bool
	cursor   int
	stage    stage
	input    textinput.Model
	inputErr string
	width    int
	height   int
	done     bool
}

func initialModel() model {
	ti := textinput.New()
	ti.Placeholder = "e.g. 10.5"
	ti.Focus()
	ti.CharLimit = 10

	return model{
		prices:   defaultPrices,
		selected: make(map[int]bool),
		input:    ti,
	}
}

// ── Update ────────────────────────────────────────────────────────────────────

func (m model) Init() tea.Cmd {
	return nil
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch m.stage {
	case stageSelect:
		return m.updateSelect(msg)
	case stageInput:
		return m.updateInput(msg)
	}
	return m, nil
}

func (m model) updateSelect(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		return m, nil
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "q":
			return m, tea.Quit

		// Movement
		case "up", "k":
			if m.cursor > 0 {
				m.cursor--
			}
		case "down", "j":
			if m.cursor < len(m.prices)-1 {
				m.cursor++
			}
		case "g":
			m.cursor = 0
		case "G":
			m.cursor = len(m.prices) - 1

		// Selection
		case " ", "x":
			m.selected[m.cursor] = !m.selected[m.cursor]
		case "a":
			if len(m.selected) == len(m.prices) {
				m.selected = make(map[int]bool)
			} else {
				for i := range m.prices {
					m.selected[i] = true
				}
			}

		// Proceed
		case "enter":
			if len(m.selected) > 0 {
				m.stage = stageInput
				m.inputErr = ""
			}
		}
	}
	return m, nil
}

func (m model) updateInput(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c":
			return m, tea.Quit
		case "esc":
			m.stage = stageSelect
			m.input.SetValue("")
			m.inputErr = ""
			return m, nil
		case "enter":
			pct, err := strconv.ParseFloat(strings.TrimSpace(m.input.Value()), 64)
			if err != nil || pct < 0 {
				m.inputErr = "Please enter a valid positive number."
				return m, nil
			}
			m.applyIncrease(pct)
			m.done = true
			return m, tea.Quit
		}
	}

	var cmd tea.Cmd
	m.input, cmd = m.input.Update(msg)
	return m, cmd
}

func (m *model) applyIncrease(pct float64) {
	multiplier := 1 + pct/100
	for i := range m.prices {
		if m.selected[i] {
			m.prices[i].Value = roundTwo(m.prices[i].Value * multiplier)
		}
	}
}

// ── View ──────────────────────────────────────────────────────────────────────

func (m model) View() string {
	var content string
	if m.stage == stageInput {
		content = m.viewInput()
	} else {
		content = m.viewSelect()
	}

	if m.width == 0 || m.height == 0 {
		return content
	}

	return lipgloss.Place(
		m.width, m.height,
		lipgloss.Center, lipgloss.Center,
		content,
	)
}

func (m model) viewSelect() string {
	var sb strings.Builder

	sb.WriteString(titleStyle.Render("Price Editor") + "\n")

	for i, p := range m.prices {
		isCursor := i == m.cursor
		isSelected := m.selected[i]

		var checkmark string
		if isSelected {
			checkmark = checkStyle.Render("●")
		} else {
			checkmark = uncheckStyle.Render("○")
		}

		priceStr := fmt.Sprintf("$%.2f", p.Value)
		leftSide := fmt.Sprintf("%-32s", p.Key)
		padding := strings.Repeat(" ", 20-len(priceStr))
		line := fmt.Sprintf("%s %s%s%s", checkmark, leftSide, padding, priceStr)
		switch {
		case isCursor:
		    sb.WriteString(cursorLineStyle.Render(
		        fmt.Sprintf("%s %s%s%s", map[bool]string{true: "●", false: "○"}[isSelected], leftSide, padding, priceStr),
		    ))
		default:
		    sb.WriteString(line)
		}
		sb.WriteString("\n")
	}

	help := helpStyle.Render(
		"↑/k up  ↓/j down  g/G top/bottom  space/x toggle  a all  enter confirm  q quit",
	)
	sb.WriteString(help)

	return sb.String()
}

func (m model) viewInput() string {
	var sb strings.Builder

	sb.WriteString(titleStyle.Render("Apply Percentage Increase") + "\n")
	sb.WriteString(fmt.Sprintf("%d item(s) selected\n", len(m.selected)))
	sb.WriteString(inputStyle.Render(m.input.View()) + "\n")

	if m.inputErr != "" {
		sb.WriteString(errorStyle.Render(m.inputErr) + "\n")
	}

	sb.WriteString(helpStyle.Render("enter confirm  esc back  ctrl+c quit"))

	return sb.String()
}

// ── Helpers ───────────────────────────────────────────────────────────────────

func roundTwo(f float64) float64 {
	v, _ := strconv.ParseFloat(fmt.Sprintf("%.2f", f), 64)
	return v
}

func formatFloat(f float64) string {
	s := strconv.FormatFloat(f, 'f', -1, 64)
	if !strings.Contains(s, ".") {
		s += ".0"
	}
	return s
}

func buildOutput(prices []PriceEntry) string {
	var sb strings.Builder
	sb.WriteString("export const PRICES = {\n")
	for _, p := range prices {
		sb.WriteString(fmt.Sprintf("  %s: %s,\n", p.Key, formatFloat(p.Value)))
	}
	sb.WriteString("};\n")
	return sb.String()
}

func clearTerminal() {
	fmt.Fprint(os.Stderr, "\033[H\033[2J")
}

// ── Main ──────────────────────────────────────────────────────────────────────

func main() {
	p := tea.NewProgram(initialModel(), tea.WithOutput(os.Stderr))
	m, err := p.Run()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}

	clearTerminal()

	fm, ok := m.(model)
	if !ok || !fm.done {
		return
	}

	output := buildOutput(fm.prices)
	if err := os.WriteFile(outputPath, []byte(output), 0644); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to write file: %v\n", err)
		os.Exit(1)
	}

	fmt.Fprintf(os.Stderr, "✓ Wrote updated prices to %s\n", outputPath)
}
