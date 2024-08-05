function onShowAsSwitch(event) {
    const isShowAsTime = isShowTimeStats();
    const eventToSend = {
        target: {
            id: isShowAsTime ? '#timeShow' : '#dateShow'
        }
    };

    if(event?.target?.id?.includes("line")) onRadioSwitch(eventToSend);
    else {
        clearTestInfo();

        let allRuns = [];

        const table = document.createElement('table');
        const headerRow = document.createElement('tr');
        const makeForEachTest = (action) => {
            document.querySelectorAll('.fixture.selected:not([class*=hidden])').forEach(fix => {
                fix.querySelectorAll('.test:not([class*=hidden])').forEach(tst => {
                    action(tst);
                });
            });
        };

        makeForEachTest((tst) => allRuns.push(...stepsData.filter(data => data.f === stepsData.find(d => d.id === tst.id).f && data.t === stepsData.find(d => d.id === tst.id).t)));
        allRuns = Object.assign([], allRuns);
        allRuns.forEach(r => r.time = new Date(r.time).toDateString());
        allRuns.sort((r1, r2) => r2.time.valueOf() - r1.time.valueOf());

        const set = new Set(allRuns.map(r => r.time));

        set.forEach(itm => {
            const header = document.createElement('th');

            header.textContent = itm;
            headerRow.appendChild(header);
        });
        table.appendChild(headerRow);

        makeForEachTest((tst) => {
            const testRuns = allRuns.filter(data => data.f === stepsData.find(d => d.id === tst.id).f && data.t === stepsData.find(d => d.id === tst.id).t);
            const testRow = document.createElement('tr');
            const testRect = tst.getBoundingClientRect();

            for (let index = 0; index < headerRow.children.length; index++) {
                const head = headerRow.children[index];
                const curDateItems = testRuns.filter(r => r.time === head.textContent);
                const cell = document.createElement('td');
                const runsElement = document.createElement('runs');

                for (let index2 = 0; index2 < curDateItems.length; index2++) {
                    const button = document.createElement('button');

                    button.style.height = `${testRect.height - 8}px`;
                    
                    button.classList.add(curDateItems[index2].status);
                    button.textContent = isShowAsTime ? curDateItems[index2].durationMs : "";

                    runsElement.appendChild(button);
                }
                cell.appendChild(runsElement);
                testRow.appendChild(cell);
            }

            testRow.style.top = `${testRect.top + 4}px`;
            table.appendChild(testRow);
        });

        document.querySelector('.tests-tree').appendChild(table);

    }
}
