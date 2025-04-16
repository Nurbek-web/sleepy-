export const staticQuestions = {
  examTitle: "Free Critical Thinking Test Questions Booklet",
  source: "AssessmentDay",
  documentInfo: {
    lastUpdated: "05-03-2015",
    timeLimit: "40 minutes",
    totalQuestions: 85
  },
  sections: [
    {
      sectionName: "Inferences",
      sectionInstructions: "An inference is a conclusion drawn from observed or supposed facts. For each inference, decide how well it follows from the given statement or information. Answer options are: True, Probably True, More Information Required, Probably False, and False.",
      statements: [
        {
          statementIdentifier: "Statement One",
          statementText: "This statement concerns Chinese government spending and military figures. (Background: Although it is agreed that China is rapidly modernising its army, there is some doubt surrounding the exact amount it is spending. Research from 'PIPPI' indicates much higher spending figures than the official government numbers, and there is a comparison with US military spending.)",
          questions: [
            {
              questionIdentifier: "Inference 1",
              questionText: "The official figures published by the Chinese government in relation to their military spending are thought to be misleading.",
              options: [
                "True",
                "Probably True",
                "More Information Required",
                "Probably False",
                "False"
              ],
              correctAnswer: "Probably True"
            },
            {
              questionIdentifier: "Inference 2",
              questionText: "It is known that the Chinese government leaves areas such as 'research' and 'development' from their official figures; however, this would also suggest that other areas of spending are also omitted from the official figure.",
              options: [
                "True",
                "Probably True",
                "More Information Required",
                "Probably False",
                "False"
              ],
              correctAnswer: "Probably True"
            },
            {
              questionIdentifier: "Inference 3",
              questionText: "The Chinese government omits several key areas from its official spending figures, in areas such as military spending, agriculture, human rights and law.",
              options: [
                "True",
                "Probably True",
                "More Information Required",
                "Probably False",
                "False"
              ],
              correctAnswer: "More Information Required"
            },
            {
              questionIdentifier: "Inference 4",
              questionText: "If there are any anomalies between the published figures on military spending and the actual figure spent, this is merely a clerical error.",
              options: [
                "True",
                "Probably True",
                "More Information Required",
                "Probably False",
                "False"
              ],
              correctAnswer: "Probably False"
            },
            {
              questionIdentifier: "Inference 5",
              questionText: "In 2010 the United States of America spent less on its military defences than the Chinese government.",
              options: [
                "True",
                "Probably True",
                "More Information Required",
                "Probably False",
                "False"
              ],
              correctAnswer: "More Information Required"
            }
          ]
        },
        {
          statementIdentifier: "Statement Two",
          statementText: "This statement provides background on Turkey's economic development, rapid growth, inflation issues, and the dependency of Turkish banks on Eurozone capital.",
          questions: [
            {
              questionIdentifier: "Inference 1",
              questionText: "There are concerns that Turkey's development is at risk of faltering in the years after 2011.",
              options: [
                "True",
                "Probably True",
                "More Information Required",
                "Probably False",
                "False"
              ],
              correctAnswer: "True"
            },
            {
              questionIdentifier: "Inference 2",
              questionText: "As Turkish banks are part-owned by those in the Eurozone, they may suffer if the European banks face financial difficulty.",
              options: [
                "True",
                "Probably True",
                "More Information Required",
                "Probably False",
                "False"
              ],
              correctAnswer: "True"
            }
          ]
        }
      ]
    },
    {
      sectionName: "Assumptions",
      sectionInstructions: "An assumption is something taken for granted. For each statement below, decide whether each proposed assumption is made (Assumption Made) or not (Assumption Not Made) based on the statement.",
      statements: [
        {
          statementIdentifier: "Statement One",
          statementText: "Monarchic nations, i.e. those with royal families, differ from republican nations in several ways. For example, citizens of monarchic nations pay more tax than citizens of republican nations.",
          questions: [
            {
              questionIdentifier: "Assumption 1",
              questionText: "The governments of monarchic nations are responsible for setting tax rates on their citizens.",
              options: [
                "Assumption Made",
                "Assumption Not Made"
              ],
              correctAnswer: "Assumption Made"
            },
            {
              questionIdentifier: "Assumption 2",
              questionText: "Republican nations do not have a royal family.",
              options: [
                "Assumption Made",
                "Assumption Not Made"
              ],
              correctAnswer: "Assumption Made"
            }
          ]
        }
      ]
    }
  ]
};

// Helper function to convert the static questions into the format expected by the app
export function getFormattedQuestions() {
  const formattedQuestions = [];
  
  for (const section of staticQuestions.sections) {
    for (const statement of section.statements) {
      for (const question of statement.questions) {
        formattedQuestions.push({
          id: question.questionIdentifier,
          question: `${statement.statementText}\n\n${question.questionText}`,
          options: question.options,
          correctAnswer: question.correctAnswer,
          explanation: `This question is from the ${section.sectionName} section. ${section.sectionInstructions}`,
          difficulty: "medium" // Default difficulty - you can adjust this as needed
        });
      }
    }
  }
  
  return formattedQuestions;
} 