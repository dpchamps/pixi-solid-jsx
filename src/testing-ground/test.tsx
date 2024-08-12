import {HorizontalFlow} from "./horizontal-flow.tsx";

export const TestComponent = () => {
    let count = 0;
    return (
        <application background={'#1099bb'} width={500} height={500} eventMode={'static'}>
            <container eventMode={'static'}>
                <HorizontalFlow padding={10}>
                    <text cursor={'pointer'} onclick={() => {count += 1}}>
                        Click me! {count}
                    </text>
                    <text style={{fontSize: 20, wordWrapWidth: 450, wordWrap: true}}>
                        This is a very long text that I'm typing. it's so damn long. I can't even belive how long it is
                        It just goes on and on. Like, literally forever. I could sit here all day and just talk
                        about how long this thing goes on. It's so much text, you wouldn't even belive.
                    </text>
                </HorizontalFlow>
            </container>

        </application>
    )
}
